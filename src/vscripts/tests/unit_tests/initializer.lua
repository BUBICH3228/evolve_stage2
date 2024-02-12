require("tests/base_unit_test")

UnitTests = UnitTests or {}

function UnitTests:ExecuteTestsForPlayer()
    local resultData = {}
    if(IsInToolsMode() == false) then
        table.insert(resultData, {
            text = "Tests disabled outside tools mode.",
            level = UNIT_TEST_LOG_LEVEL_ERROR
        })
        return resultData
    end
    local tests = {
        {
            name = "npc_items_custom.txt",
            content = require("tests/npc_items_custom_test")
        },
        {
            name = "npc_abilities_custom.txt",
            content = require("tests/npc_abilities_custom_test")
        },
        {
            name = "npc_heroes_custom.txt",
            content = require("tests/npc_heroes_custom_test")
        },
        {
            name = "units_inventory",
            content = require("tests/units_inventory_test")
        },
        {
            name = "lua_script_file",
            content = require("tests/lua_script_file_test")
        }
    }

    local status, result = false, 0
    local errorsCount = 0
    for _, v in ipairs(tests) do
        table.insert(resultData, {
            text = "Test ["..tostring(v.name).."] started.",
            level = UNIT_TEST_LOG_LEVEL_INFO
        })
        status, result = xpcall(v.content.OnExecute, Debug_PrintError)
        if(status == true) then
            for _, errorText in pairs(result) do
                table.insert(resultData, {
                    text = errorText:gsub("\n", "<br>"),
                    level = UNIT_TEST_LOG_LEVEL_ERROR
                })
                print(errorText)
            end
            errorsCount = errorsCount + #result
        else
            table.insert(resultData, {
                text = "Some shit happened during test. Check console.",
                level = UNIT_TEST_LOG_LEVEL_ERROR
            })
            errorsCount = errorsCount + 1
        end
        local resultLevel = UNIT_TEST_LOG_LEVEL_SUCCESS
        local text = "Test ["..tostring(v.name).."] finished without issues."
        if(errorsCount > 0) then
            resultLevel = UNIT_TEST_LOG_LEVEL_ERROR
            text = "Test ["..tostring(v.name).."] finished with "..tostring(errorsCount).." issue(s)."
        end
        table.insert(resultData, {
            text = text,
            level = resultLevel
        })
    end
    local resultLevel = UNIT_TEST_LOG_LEVEL_SUCCESS
    if(errorsCount > 0) then
        resultLevel = UNIT_TEST_LOG_LEVEL_ERROR
    end
    local article = "are"
    if(errorsCount == 0) then
        article = "is"
    end
    table.insert(resultData, {
            text = "All tests finished. There " .. article .. " "..tostring(errorsCount).." issue(s) to fix.",
            level = resultLevel
    })
    return resultData
end