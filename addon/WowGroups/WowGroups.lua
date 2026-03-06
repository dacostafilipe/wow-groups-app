local ADDON_NAME = "WowGroups"

-- ============================================================
-- Class token (uppercase, no spaces) → PascalCase display name
-- Must match exactly what the web app parser expects.
-- ============================================================
local CLASS_MAP = {
    WARRIOR     = "Warrior",
    PALADIN     = "Paladin",
    HUNTER      = "Hunter",
    ROGUE       = "Rogue",
    PRIEST      = "Priest",
    DEATHKNIGHT = "DeathKnight",
    SHAMAN      = "Shaman",
    MAGE        = "Mage",
    WARLOCK     = "Warlock",
    MONK        = "Monk",
    DRUID       = "Druid",
    DEMONHUNTER = "DemonHunter",
    EVOKER      = "Evoker",
}

-- Equipment slots used for average ilvl calculation.
-- Slot 4 (shirt) and 19 (tabard) are intentionally excluded.
local EQUIP_SLOTS = { 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 }

local WowGroups    = {}
local roster       = {}
local inspectQueue = {}
local inspectIndex = 0
local isCollecting = false
local mainFrame
local outputBox
local statusText

-- ============================================================
-- Helpers
-- ============================================================

-- Removes all spaces from a spec name so "Beast Mastery" → "BeastMastery"
local function stripSpaces(s)
    return (s or "Unknown"):gsub("%s+", "")
end

-- Averages the effective ilvl of all equipped items on a unit that has
-- already been inspected. Returns 0 if no items can be read.
local function getInspectIlvl(unit)
    local total, count = 0, 0
    for _, slot in ipairs(EQUIP_SLOTS) do
        local link = GetInventoryItemLink(unit, slot)
        if link then
            local ilvl = GetDetailedItemLevelInfo(link)
            if ilvl and ilvl > 0 then
                total = total + ilvl
                count = count + 1
            end
        end
    end
    return count > 0 and math.floor(total / count) or 0
end

-- Collects all available data for a unit.
-- For "player" (self) no inspection is required.
-- For others this must be called AFTER INSPECT_READY fires.
local function collectPlayer(unit)
    local name = UnitName(unit)
    if not name or name == "Unknown" then return nil end

    local _, classToken = UnitClass(unit)
    local className = CLASS_MAP[classToken] or classToken or "Unknown"
    local specName  = "Unknown"
    local ilvl      = 0
    local rating    = 0

    if UnitIsUnit(unit, "player") then
        local specIndex = GetSpecialization()
        if specIndex then
            local _, sName = GetSpecializationInfo(specIndex)
            specName = stripSpaces(sName)
        end
        local _, equippedIlvl = GetAverageItemLevel()
        ilvl   = math.floor(equippedIlvl or 0)
        rating = math.floor(C_MythicPlus.GetOverallDungeonScore("player") or 0)
    else
        local specID = GetInspectSpecialization(unit)
        if specID and specID ~= 0 then
            local _, sName = GetSpecializationInfoByID(specID)
            specName = stripSpaces(sName or "Unknown")
        end
        ilvl   = getInspectIlvl(unit)
        rating = math.floor(C_MythicPlus.GetOverallDungeonScore(unit) or 0)
    end

    return { name = name, class = className, spec = specName, ilvl = ilvl, rating = rating }
end

-- ============================================================
-- Inspect queue
-- ============================================================

local function onInspectReady()
    if not isCollecting then return end

    local unit = inspectQueue[inspectIndex]
    if unit then
        local data = collectPlayer(unit)
        if data then table.insert(roster, data) end
        ClearInspectPlayer()
    end

    inspectIndex = inspectIndex + 1
    -- Small delay between requests to avoid server-side throttling.
    C_Timer.After(0.5, function() WowGroups:InspectNext() end)
end

function WowGroups:InspectNext()
    if inspectIndex > #inspectQueue then
        isCollecting = false
        statusText:SetText("|cff00ff00Done — " .. #roster .. " players collected.|r")
        self:UpdateOutput()
        return
    end

    local unit = inspectQueue[inspectIndex]
    local name = UnitName(unit) or "?"
    statusText:SetText("Inspecting " .. name .. " (" .. inspectIndex .. "/" .. #inspectQueue .. ")")

    if UnitExists(unit) and CanInspect(unit) then
        NotifyInspect(unit)
    else
        -- Unit is out of range or unavailable; record with zeroed stats.
        if name ~= "Unknown" and name ~= "?" then
            local _, classToken = UnitClass(unit)
            table.insert(roster, {
                name   = name,
                class  = CLASS_MAP[classToken] or classToken or "Unknown",
                spec   = "Unknown",
                ilvl   = 0,
                rating = 0,
            })
        end
        inspectIndex = inspectIndex + 1
        C_Timer.After(0.1, function() self:InspectNext() end)
    end
end

-- ============================================================
-- Collection entry point
-- ============================================================

function WowGroups:StartCollection()
    roster       = {}
    inspectQueue = {}
    isCollecting = true
    statusText:SetText("Collecting roster…")
    outputBox:SetText("")

    -- Self: no inspection needed.
    local selfData = collectPlayer("player")
    if selfData then table.insert(roster, selfData) end

    -- Everyone else in the group/raid goes into the inspect queue.
    if IsInRaid() then
        for i = 1, GetNumGroupMembers() do
            local unit = "raid" .. i
            if not UnitIsUnit(unit, "player") then
                table.insert(inspectQueue, unit)
            end
        end
    elseif IsInGroup() then
        for i = 1, GetNumSubgroupMembers() do
            table.insert(inspectQueue, "party" .. i)
        end
    end

    if #inspectQueue == 0 then
        isCollecting = false
        statusText:SetText("|cff00ff00Done — " .. #roster .. " player(s) collected.|r")
        self:UpdateOutput()
        return
    end

    inspectIndex = 1
    self:InspectNext()
end

-- ============================================================
-- Output
-- ============================================================

function WowGroups:UpdateOutput()
    local lines = {}
    for _, p in ipairs(roster) do
        table.insert(lines, p.name .. "|" .. p.class .. "|" .. p.spec
            .. "|" .. p.ilvl .. "|" .. p.rating)
    end
    outputBox:SetText(table.concat(lines, "\n"))
    outputBox:SetCursorPosition(0)
end

-- ============================================================
-- Main frame
-- ============================================================

local function createMainFrame()
    local f = CreateFrame("Frame", "WowGroupsFrame", UIParent, "BasicFrameTemplateWithInset")
    f:SetSize(520, 440)
    f:SetPoint("CENTER")
    f:SetMovable(true)
    f:EnableMouse(true)
    f:RegisterForDrag("LeftButton")
    f:SetScript("OnDragStart", f.StartMoving)
    f:SetScript("OnDragStop",  f.StopMovingOrSizing)
    f:SetClampedToScreen(true)
    f:Hide()

    f.TitleText:SetText("WowGroups — Roster Export")

    -- Scrollable edit box that the leader can select-all and copy.
    local scroll = CreateFrame("ScrollFrame", "WowGroupsScroll", f, "UIPanelScrollFrameTemplate")
    scroll:SetPoint("TOPLEFT",     f, "TOPLEFT",     10,  -30)
    scroll:SetPoint("BOTTOMRIGHT", f, "BOTTOMRIGHT", -30,  50)

    local edit = CreateFrame("EditBox", "WowGroupsEdit", scroll)
    edit:SetMultiLine(true)
    edit:SetFontObject(GameFontNormal)
    edit:SetWidth(460)
    edit:SetAutoFocus(false)
    edit:SetScript("OnEscapePressed", function() f:Hide() end)
    scroll:SetScrollChild(edit)
    outputBox = edit

    -- Status label (bottom-right)
    statusText = f:CreateFontString(nil, "OVERLAY", "GameFontHighlight")
    statusText:SetPoint("BOTTOMRIGHT", f, "BOTTOMRIGHT", -10, 14)
    statusText:SetText("")

    -- "Select All" button — focuses the EditBox and highlights everything
    -- so the leader can Ctrl+C in one step.
    local btnSelect = CreateFrame("Button", nil, f, "GameMenuButtonTemplate")
    btnSelect:SetSize(110, 25)
    btnSelect:SetPoint("BOTTOMLEFT", f, "BOTTOMLEFT", 10, 10)
    btnSelect:SetText("Select All")
    btnSelect:SetScript("OnClick", function()
        edit:SetFocus()
        edit:HighlightText()
    end)

    -- "Refresh" button — re-runs the full collection.
    local btnRefresh = CreateFrame("Button", nil, f, "GameMenuButtonTemplate")
    btnRefresh:SetSize(110, 25)
    btnRefresh:SetPoint("LEFT", btnSelect, "RIGHT", 5, 0)
    btnRefresh:SetText("Refresh")
    btnRefresh:SetScript("OnClick", function()
        WowGroups:StartCollection()
    end)

    mainFrame = f
end

-- ============================================================
-- Minimap button
-- ============================================================

local function createMinimapButton()
    local btn = CreateFrame("Button", "WowGroupsMinimapBtn", Minimap)
    btn:SetSize(32, 32)
    btn:SetFrameStrata("MEDIUM")
    btn:SetFrameLevel(8)

    -- Angle (radians) of the button's position around the minimap edge.
    -- 45° places it in the upper-right quadrant.
    local angle = math.rad(45)

    local function reposition()
        btn:SetPoint("CENTER", Minimap, "CENTER",
            math.cos(angle) * 80, math.sin(angle) * 80)
    end
    reposition()

    -- Icon — uses a built-in WoW dungeon icon; change to any valid
    -- Interface\Icons\* path if you prefer a different look.
    local icon = btn:CreateTexture(nil, "BACKGROUND")
    icon:SetSize(20, 20)
    icon:SetPoint("CENTER")
    icon:SetTexture("Interface\\Icons\\Achievement_Dungeon_GlacierArmament_01")

    -- Standard circular minimap-button border.
    local border = btn:CreateTexture(nil, "OVERLAY")
    border:SetSize(54, 54)
    border:SetPoint("TOPLEFT", btn, "TOPLEFT", -11, 11)
    border:SetTexture("Interface\\Minimap\\MiniMap-TrackingBorder")

    btn:SetHighlightTexture("Interface\\Minimap\\UI-Minimap-ZoomButton-Highlight")

    btn:SetScript("OnClick", function()
        if mainFrame:IsShown() then
            mainFrame:Hide()
        else
            mainFrame:Show()
            WowGroups:StartCollection()
        end
    end)

    btn:SetScript("OnEnter", function(self)
        GameTooltip:SetOwner(self, "ANCHOR_LEFT")
        GameTooltip:AddLine("WowGroups")
        GameTooltip:AddLine("Click to export group roster", 1, 1, 1)
        GameTooltip:Show()
    end)

    btn:SetScript("OnLeave", function() GameTooltip:Hide() end)

    -- Drag the button around the minimap edge.
    btn:RegisterForDrag("LeftButton")
    btn:SetScript("OnDragStart", function(self)
        self:SetScript("OnUpdate", function()
            local mx, my = Minimap:GetCenter()
            local px, py = GetCursorPosition()
            local scale  = UIParent:GetEffectiveScale()
            angle = math.atan2(py / scale - my, px / scale - mx)
            reposition()
        end)
    end)
    btn:SetScript("OnDragStop", function(self)
        self:SetScript("OnUpdate", nil)
    end)
end

-- ============================================================
-- Bootstrap
-- ============================================================

local eventFrame = CreateFrame("Frame")
eventFrame:RegisterEvent("ADDON_LOADED")
eventFrame:RegisterEvent("INSPECT_READY")
eventFrame:SetScript("OnEvent", function(_, event, arg1)
    if event == "ADDON_LOADED" and arg1 == ADDON_NAME then
        createMainFrame()
        createMinimapButton()

        SLASH_WOWGROUPS1 = "/wowgroups"
        SLASH_WOWGROUPS2 = "/wg"
        SlashCmdList["WOWGROUPS"] = function()
            if mainFrame:IsShown() then
                mainFrame:Hide()
            else
                mainFrame:Show()
                WowGroups:StartCollection()
            end
        end

        print("|cff00ff00WowGroups|r loaded — /wowgroups or /wg to open, or click the minimap button.")

    elseif event == "INSPECT_READY" then
        onInspectReady()
    end
end)
