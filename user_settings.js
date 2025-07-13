'use strict';

function createFloatingButton(DEFAULT_SETTINGS) {
    const settingBtn = document.createElement('button');
    settingBtn.id = 'settingBtn';
    settingBtn.textContent = '+';
    settingBtn.style.fontWeight = 'bold';
    settingBtn.style.position = 'fixed';
    settingBtn.style.bottom = '20px';
    settingBtn.style.right = '20px';
    settingBtn.style.width = '40px';
    settingBtn.style.height = '40px';
    settingBtn.style.padding = '0';
    settingBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    settingBtn.style.color = 'rgba(64, 195, 221, 0.9)';
    settingBtn.style.border = 'none';
    settingBtn.style.borderRadius = '50%';
    settingBtn.style.cursor = 'pointer';
    settingBtn.style.zIndex = '1001';
    settingBtn.style.fontSize = '24px';
    settingBtn.style.display = 'flex';
    settingBtn.style.alignItems = 'center';
    settingBtn.style.justifyContent = 'center';
    settingBtn.style.transition = 'transform 0.3s';

    settingBtn.onclick = () => toggleSettingsPanel(DEFAULT_SETTINGS);

    document.body.appendChild(settingBtn);
}

function toggleSettingsPanel(DEFAULT_SETTINGS) {
    const settingBtn = document.querySelector('#settingBtn');
    let settingPanel = document.getElementById('setting-panel');
    if (settingPanel) {
        settingBtn.style.transform = 'rotate(-360deg)';

        requestAnimationFrame(() => {
            settingPanel.style.opacity = '0';
        });

        setTimeout(() => {
            settingPanel.remove();
        }, 500);
    } else {
        settingBtn.style.transform = 'rotate(360deg)';
        createSettingsPanel(DEFAULT_SETTINGS, getCookie('ANIME_dark_theme'));
    }
}

/**
 * Create a settings panel with user options.
 * @param {Object} DEFAULT_SETTINGS - An object containing default settings for the script
 * @param {boolean} isDarkMode - A boolean indicating if the dark theme is enabled
 **/
function createSettingsPanel(DEFAULT_SETTINGS, isDarkMode) {
    let autoExpandMenu = GM_getValue('autoExpandMenu', DEFAULT_SETTINGS.autoExpandMenu);
    let enableCenteredDanmukuBox = GM_getValue('enableCenteredDanmukuBox', DEFAULT_SETTINGS.enableCenteredDanmukuBox);
    let enableSpeedControlShortcut = GM_getValue('enableSpeedControlShortcut', DEFAULT_SETTINGS.enableSpeedControlShortcut);
    let enableAutoInputPaymentInfo = GM_getValue('enableAutoInputPaymentInfo', DEFAULT_SETTINGS.enableAutoInputPaymentInfo);
    let enableSkipVideo = GM_getValue('enableSkipVideo', DEFAULT_SETTINGS.enableSkipVideo);
    let skipDuration = GM_getValue('skipDuration', DEFAULT_SETTINGS.skipDuration);
    let phoneBarcode = GM_getValue('phoneBarcode', DEFAULT_SETTINGS.phoneBarcode);

    const settingPanel = document.createElement('div');
    settingPanel.id = 'setting-panel';
    settingPanel.style.display = 'flex';
    settingPanel.style.flexDirection = 'column';
    settingPanel.style.position = 'fixed';
    settingPanel.style.right = '20px';
    settingPanel.style.bottom = '60px';
    settingPanel.style.width = '520px';
    settingPanel.style.minWidth = '520px';
    settingPanel.style.height = 'auto';
    settingPanel.style.maxHeight = '50vh';
    settingPanel.style.minHeight = '280px';
    settingPanel.style.padding = '10px 15px';
    settingPanel.style.marginBottom = '20px';
    settingPanel.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    settingPanel.style.border = '1px solid #ccc';
    settingPanel.style.borderRadius = '8px';
    settingPanel.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    settingPanel.style.zIndex = '1001';
    settingPanel.style.fontSize = '14px';
    settingPanel.style.opacity = '0';
    settingPanel.style.transition = 'opacity 0.2s';

    document.body.appendChild(settingPanel);

    // Trigger the fade-in effect
    requestAnimationFrame(() => {
        settingPanel.style.opacity = '1';
    });

    const title = document.createElement('h3');
    if (isDarkMode) {
        title.style.color = 'black';
    }
    title.textContent = 'Settings';
    title.style.fontWeight = 'bold';
    title.style.textAlign = 'center';
    title.style.fontSize = '20px';
    title.style.userSelect = 'none';
    settingPanel.appendChild(title);

    // Create option container to hold all options
    const optionContainer = createOptionContainer();
    optionContainer.style.flex = '1 1 auto';
    optionContainer.style.overflowY = 'auto';
    optionContainer.style.minHeight = '0';

    // Create containers for user option
    const autoExpandMenuContainer = createOption('autoExpandMenuCheckbox', isDarkMode, '首頁自動展開更多影片', autoExpandMenu);
    const centeredDanmukuBoxContainer = createOption('centeredDanmukuBoxCheckbox', isDarkMode, '啟用浮動彈幕輸入框 (F1)', enableCenteredDanmukuBox);
    const enableSkipVideoContainer = createOption('enableSkipVideoCheckbox', isDarkMode, '啟用跳過秒數 (Ctrl + F2)', enableSkipVideo, true, skipDuration + ' 秒', 'skipDuration', '輸入跳過秒數');
    const speedControlShortcutContainer = createOption('speedControlShortcutCheckbox', isDarkMode, '啟用速度調整快捷鍵 (Shift + >/<)', enableSpeedControlShortcut);
    const autoInputPaymentInfoContainer = createOption('autoInputPaymentInfoCheckbox', isDarkMode, '付費自動勾選同意 & 填入發票資訊', enableAutoInputPaymentInfo, true, phoneBarcode, 'phoneBarcode', '輸入載具條碼');

    optionContainer.appendChild(autoExpandMenuContainer.container);
    optionContainer.appendChild(centeredDanmukuBoxContainer.container);
    optionContainer.appendChild(enableSkipVideoContainer.container);
    optionContainer.appendChild(speedControlShortcutContainer.container);
    optionContainer.appendChild(autoInputPaymentInfoContainer.container);

    settingPanel.appendChild(optionContainer);

    // Apply button
    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply';
    applyBtn.style.flexShrink = '0';
    applyBtn.style.alignSelf = 'center';
    applyBtn.style.margin = '5px';
    applyBtn.style.padding = '10px 20px';
    applyBtn.style.backgroundColor = 'rgba(64, 195, 221, 0.9)';
    applyBtn.style.color = 'white';
    applyBtn.style.border = 'none';
    applyBtn.style.borderRadius = '5px';
    applyBtn.style.cursor = 'pointer';

    applyBtn.onclick = () => {
        autoExpandMenu = autoExpandMenuContainer.checkBox.checked;
        GM_setValue('autoExpandMenu', autoExpandMenu);

        enableCenteredDanmukuBox = centeredDanmukuBoxContainer.checkBox.checked;
        GM_setValue('enableCenteredDanmukuBox', enableCenteredDanmukuBox);

        enableSkipVideo = enableSkipVideoContainer.checkBox.checked;
        GM_setValue('enableSkipVideo', enableSkipVideo);

        skipDuration = document.querySelector('#skipDuration').value;
        GM_setValue('skipDuration', skipDuration);

        enableSpeedControlShortcut = speedControlShortcutContainer.checkBox.checked;
        GM_setValue('enableSpeedControlShortcut', enableSpeedControlShortcut);

        enableAutoInputPaymentInfo = autoInputPaymentInfoContainer.checkBox.checked;
        GM_setValue('enableAutoInputPaymentInfo', enableAutoInputPaymentInfo);

        phoneBarcode = document.querySelector('#phoneBarcode').value;
        GM_setValue('phoneBarcode', phoneBarcode);


        showFloatingMessage('已套用設定');
    };

    settingPanel.appendChild(applyBtn);

    document.body.appendChild(settingPanel);
}

function createOptionContainer() {
    const optionContainer = document.createElement('div');
    optionContainer.style.display = 'flex';
    optionContainer.style.flexDirection = 'column';
    optionContainer.style.marginTop = '10px';
    return optionContainer;
}

/**
 * Create a checkbox option with a label and an optional input box.
 * @param {string} elementID - The ID for the checkbox input
 * @param {boolean} isDarkMode - A boolean indicating if the dark theme is enabled
 * @param {string} labelText - The text for the label
 * @param {boolean} isChecked - Whether the checkbox should be checked by default
 * @param {boolean} [needInputBox=false] - Whether to include an input box
 * @param {string|null} [inputBoxValue=null] - The value for the input box, if needed
 * @param {string|null} [inputBoxID=null] - The ID for the input box, if needed
 * @param {string|null} [inputBoxPlaceholder=null] - The placeholder text for the input box, if needed
 * @return {Object} An object containing the container and checkbox elements
 **/
function createOption(elementID, isDarkMode, labelText, isChecked, needInputBox = false, inputBoxValue = null, inputBoxID = null, inputBoxPlaceholder = null) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.marginBottom = '10px';

    const checkBox = document.createElement('input');
    checkBox.id = elementID;
    checkBox.type = 'checkbox';
    checkBox.checked = isChecked;
    checkBox.style.width = '20px';
    checkBox.style.height = '20px';

    const label = document.createElement('label');
    if (isDarkMode) {
        label.style.color = 'black';
    }
    label.textContent = labelText;
    label.style.fontSize = '16px';
    label.style.marginLeft = '5px';
    label.htmlFor = elementID;
    label.style.userSelect = 'none';

    container.appendChild(checkBox);
    container.appendChild(label);

    if (needInputBox) {
        const inputBox = document.createElement('input');
        inputBox.id = inputBoxID;
        inputBox.type = 'text';
        inputBox.style.position = 'relative';
        inputBox.style.marginLeft = '8px';
        inputBox.style.bottom = '1px';
        inputBox.style.width = '100px';
        inputBox.style.height = '25px';
        inputBox.style.border = '1px solid #ccc';
        inputBox.style.borderRadius = '5px';
        inputBox.style.padding = '5px';
        inputBox.style.fontSize = '14px';
        inputBox.style.outline = 'none';
        inputBox.autocomplete = 'off';

        // Convert input to uppercase real-time
        inputBox.oninput = function () {
            this.value = this.value.toUpperCase();
        };

        if (inputBoxValue) {
            inputBox.placeholder = inputBoxValue;
        } else {
            inputBox.placeholder = inputBoxPlaceholder;
        }

        container.appendChild(inputBox);
    }


    return { container, checkBox };
}