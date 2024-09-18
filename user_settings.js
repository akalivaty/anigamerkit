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
        createSettingsPanel(DEFAULT_SETTINGS);
    }
}

function createSettingsPanel(DEFAULT_SETTINGS) {

    let autoExpandMenu = GM_getValue('autoExpandMenu', DEFAULT_SETTINGS.autoExpandMenu);
    let enableCenteredDanmukuBox = GM_getValue('enableCenteredDanmukuBox', DEFAULT_SETTINGS.enableCenteredDanmukuBox);
    let enableSpeedControlShortcut = GM_getValue('enableSpeedControlShortcut', DEFAULT_SETTINGS.enableSpeedControlShortcut);

    const settingPanel = document.createElement('div');
    settingPanel.id = 'setting-panel';
    settingPanel.style.position = 'fixed';
    settingPanel.style.right = '20px';
    settingPanel.style.bottom = '60px';
    settingPanel.style.width = '30%';
    settingPanel.style.height = '30%';
    settingPanel.style.padding = '20px';
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
    title.textContent = 'Settings';
    title.style.fontWeight = 'bold';
    title.style.textAlign = 'center';
    title.style.fontSize = '20px';
    title.style.userSelect = 'none';
    settingPanel.appendChild(title);

    // Create option container to hold all options
    const optionContainer = createOptionContainer();

    // Create containers for user option
    const autoExpandMenuContainer = createOption('autoExpandMenuCheckbox', '首頁自動展開更多影片', autoExpandMenu);
    const centeredDanmukuBoxContainer = createOption('centeredDanmukuBoxCheckbox', '啟用浮動彈幕輸入框 (F1)', enableCenteredDanmukuBox);
    const speedControlShortcutContainer = createOption('speedControlShortcutCheckbox', '啟用速度調整快捷鍵 (Shift + >/<)', enableSpeedControlShortcut);

    optionContainer.appendChild(autoExpandMenuContainer.container);
    optionContainer.appendChild(centeredDanmukuBoxContainer.container);
    optionContainer.appendChild(speedControlShortcutContainer.container);

    settingPanel.appendChild(optionContainer);

    // Apply button
    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply';
    applyBtn.style.position = 'absolute';
    applyBtn.style.left = '50%';
    applyBtn.style.bottom = '10px';
    applyBtn.style.transform = 'translateX(-50%)';
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

        enableSpeedControlShortcut = speedControlShortcutContainer.checkBox.checked;
        GM_setValue('enableSpeedControlShortcut', enableSpeedControlShortcut);


        showFloatingMessage('Settings have been applied.');
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

function createOption(elementID, labelText, isChecked) {
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
    label.textContent = labelText;
    label.style.fontSize = '16px';
    label.style.marginLeft = '5px';
    label.htmlFor = elementID;
    label.style.userSelect = 'none';

    container.appendChild(checkBox);
    container.appendChild(label);

    return { container, checkBox };
}