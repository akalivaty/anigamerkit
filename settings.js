'use strict';

function createFloatingButton(DEFAULT_SETTINGS) {
    const settingBtn = document.createElement('button');
    settingBtn.id = 'settingBtn';
    settingBtn.textContent = '+'; // Set the button content to '+'
    settingBtn.style.fontWeight = 'bold';
    settingBtn.style.position = 'fixed';
    settingBtn.style.bottom = '20px';
    settingBtn.style.right = '20px';
    settingBtn.style.width = '40px'; // Set width to make it square
    settingBtn.style.height = '40px'; // Set height to make it square
    settingBtn.style.padding = '0'; // Remove padding
    settingBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    settingBtn.style.color = 'rgba(64, 195, 221, 0.9)';
    settingBtn.style.border = 'none';
    settingBtn.style.borderRadius = '50%'; // Make it circular
    settingBtn.style.cursor = 'pointer';
    settingBtn.style.zIndex = '1001';
    settingBtn.style.fontSize = '24px'; // Increase font size for better visibility
    settingBtn.style.display = 'flex';
    settingBtn.style.alignItems = 'center';
    settingBtn.style.justifyContent = 'center';
    settingBtn.style.transition = 'transform 0.3s';

    settingBtn.onclick = () => toggleSettingsPanel(DEFAULT_SETTINGS);

    document.body.appendChild(settingBtn);
}

function toggleSettingsPanel(DEFAULT_SETTINGS) {
    const settingBtn = document.querySelector('#settingBtn');
    let showingPanel = document.getElementById('settings-panel');
    if (showingPanel) {
        settingBtn.style.transform = 'rotate(-360deg)';
        showingPanel.classList.remove('fade-in');
        showingPanel.classList.add('fade-out');
        setTimeout(() => {
            showingPanel.remove();
        }, 500); // Wait for the fade-out effect to complete
    } else {
        settingBtn.style.transform = 'rotate(360deg)';
        createSettingsPanel(DEFAULT_SETTINGS);
    }
}

function createSettingsPanel(DEFAULT_SETTINGS) {

    let autoExpandMenu = GM_getValue('autoExpandMenu', DEFAULT_SETTINGS.autoExpandMenu);
    let enableCenteredDanmukuBox = GM_getValue('enableCenteredDanmukuBox', DEFAULT_SETTINGS.enableCenteredDanmukuBox);

    const settingPanel = document.createElement('div');
    settingPanel.id = 'settings-panel';
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
    settingPanel.style.transition = 'opacity 0.2s';

    settingPanel.style.opacity = '0'; // Set initial opacity to 0
    document.body.appendChild(settingPanel);
    setTimeout(() => {
        settingPanel.classList.add('fade-in');
    }, 0); // Trigger fade-in effect

    const title = document.createElement('h3');
    title.textContent = 'Settings';
    title.style.fontWeight = 'bold';
    title.style.textAlign = 'center';
    title.style.fontSize = '20px';
    title.style.userSelect = 'none';
    settingPanel.appendChild(title);

    // Container for options
    const option_container = document.createElement('div');
    option_container.style.display = 'flex';
    option_container.style.flexDirection = 'column';
    option_container.style.marginTop = '10px';

    // Option to enable/disable auto expand menu
    const container_AEM = document.createElement('div');
    container_AEM.style.display = 'flex';
    container_AEM.style.alignItems = 'center';
    container_AEM.style.marginBottom = '10px';

    const checkBox_AEM = document.createElement('input');
    checkBox_AEM.id = 'autoExpandMenuCheckbox';
    checkBox_AEM.type = 'checkbox';
    checkBox_AEM.checked = autoExpandMenu;
    checkBox_AEM.style.width = '20px';
    checkBox_AEM.style.height = '20px';

    const label_AEM = document.createElement('label');
    label_AEM.textContent = 'Enable Auto Expand Menu';
    label_AEM.style.fontSize = '16px';
    label_AEM.style.marginLeft = '5px';
    label_AEM.htmlFor = 'autoExpandMenuCheckbox';
    label_AEM.style.userSelect = 'none';

    container_AEM.appendChild(checkBox_AEM);
    container_AEM.appendChild(label_AEM);

    // Option to enable/disable centered danmuku box
    const container_CDB = document.createElement('div');
    container_CDB.style.display = 'flex';
    container_CDB.style.alignItems = 'center';

    const checkBox_CDB = document.createElement('input');
    checkBox_CDB.id = 'centeredDanmukuBoxCheckbox';
    checkBox_CDB.type = 'checkbox';
    checkBox_CDB.checked = enableCenteredDanmukuBox;
    checkBox_CDB.style.width = '20px';
    checkBox_CDB.style.height = '20px';

    const label_CDB = document.createElement('label');
    label_CDB.textContent = 'Enable Centered Danmuku Box';
    label_CDB.style.fontSize = '16px';
    label_CDB.style.marginLeft = '5px';
    label_CDB.htmlFor = 'centeredDanmukuBoxCheckbox';
    label_CDB.style.userSelect = 'none';

    container_CDB.appendChild(checkBox_CDB);
    container_CDB.appendChild(label_CDB);

    option_container.appendChild(container_AEM);
    option_container.appendChild(container_CDB);

    settingPanel.appendChild(option_container);

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
        autoExpandMenu = checkBox_AEM.checked;
        GM_setValue('autoExpandMenu', autoExpandMenu);
        enableCenteredDanmukuBox = checkBox_CDB.checked;
        GM_setValue('enableInputBox', enableCenteredDanmukuBox);

        showFloatingMessage('Settings have been applied.');
    };

    settingPanel.appendChild(applyBtn);

    document.body.appendChild(settingPanel);
}