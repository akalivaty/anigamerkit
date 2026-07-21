'use strict';

const SETTINGS_SCHEMA = [
    {
        key: 'autoExpandMenu',
        checkboxId: 'autoExpandMenuCheckbox',
        label: '首頁自動展開更多影片'
    },
    {
        key: 'showVideoPoster',
        checkboxId: 'showVideoPosterCheckbox',
        label: '影片頁面顯示封面圖'
    },
    {
        key: 'enableFloatingVideo',
        checkboxId: 'floatingVideoCheckbox',
        label: '影片捲出畫面時顯示右下角浮動播放器'
    },
    {
        key: 'enableCenteredDanmukuBox',
        checkboxId: 'centeredDanmukuBoxCheckbox',
        label: '啟用浮動彈幕輸入框 (Tab)'
    },
    {
        key: 'enableSkipVideo',
        checkboxId: 'enableSkipVideoCheckbox',
        label: '啟用跳過秒數 (數字 1 鍵)',
        input: {
            key: 'skipDuration',
            id: 'skipDuration',
            type: 'number',
            min: 0,
            placeholder: '輸入跳過秒數'
        }
    },
    {
        key: 'enableSpeedControlShortcut',
        checkboxId: 'speedControlShortcutCheckbox',
        label: '啟用速度調整快捷鍵 (Shift + >/<)'
    },
    {
        key: 'enableAutoInputPaymentInfo',
        checkboxId: 'autoInputPaymentInfoCheckbox',
        label: '付費自動勾選同意 & 填入發票資訊',
        input: {
            key: 'phoneBarcode',
            id: 'phoneBarcode',
            type: 'text',
            uppercase: true,
            placeholder: '輸入載具條碼'
        }
    }
];

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
    settingBtn.style.zIndex = '2147483647';
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
    const settingPanel = document.getElementById('setting-panel');
    if (!settingBtn) {
        return;
    }

    if (settingPanel) {
        settingBtn.style.transform = 'rotate(-360deg)';
        settingPanel.classList.remove('is-visible');

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
    const settingPanel = document.createElement('div');
    settingPanel.id = 'setting-panel';
    settingPanel.className = 'anigamerkit-settings-panel';

    const title = document.createElement('h3');
    title.className = 'anigamerkit-settings-title';
    if (isDarkMode) {
        title.classList.add('anigamerkit-settings-dark-text');
    }
    title.textContent = 'Settings';
    settingPanel.appendChild(title);

    const optionContainer = createOptionContainer();
    const optionControls = SETTINGS_SCHEMA.map((setting) => {
        const viewModel = {
            ...setting,
            checked: GM_getValue(setting.key, DEFAULT_SETTINGS[setting.key]),
            input: setting.input ? {
                ...setting.input,
                value: GM_getValue(setting.input.key, DEFAULT_SETTINGS[setting.input.key])
            } : null
        };
        const control = createOption(viewModel, isDarkMode);
        optionContainer.appendChild(control.container);
        return control;
    });

    settingPanel.appendChild(optionContainer);

    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply';
    applyBtn.className = 'anigamerkit-settings-apply';

    applyBtn.onclick = () => {
        optionControls.forEach((control) => saveOption(control, DEFAULT_SETTINGS));
        showFloatingMessage('已套用設定');
    };

    settingPanel.appendChild(applyBtn);
    document.body.appendChild(settingPanel);

    requestAnimationFrame(() => {
        settingPanel.classList.add('is-visible');
    });
}

function createOptionContainer() {
    const optionContainer = document.createElement('div');
    optionContainer.className = 'anigamerkit-settings-options';
    return optionContainer;
}

/**
 * Create a checkbox option with a label and an optional input box.
 * @param {Object} setting - Settings schema entry with its stored values
 * @param {boolean} isDarkMode - A boolean indicating if the dark theme is enabled
 * @return {Object} The rendered controls and their schema entry
 **/
function createOption(setting, isDarkMode) {
    const container = document.createElement('div');
    container.className = 'anigamerkit-settings-option';

    const checkBox = document.createElement('input');
    checkBox.id = setting.checkboxId;
    checkBox.type = 'checkbox';
    checkBox.checked = setting.checked;
    checkBox.className = 'anigamerkit-settings-checkbox';

    const label = document.createElement('label');
    label.className = 'anigamerkit-settings-label';
    if (isDarkMode) {
        label.classList.add('anigamerkit-settings-dark-text');
    }
    label.textContent = setting.label;
    label.htmlFor = setting.checkboxId;

    container.appendChild(checkBox);
    container.appendChild(label);

    let inputBox = null;
    if (setting.input) {
        inputBox = document.createElement('input');
        inputBox.id = setting.input.id;
        inputBox.type = setting.input.type;
        inputBox.value = setting.input.value ?? '';
        inputBox.placeholder = setting.input.placeholder;
        inputBox.className = 'anigamerkit-settings-input';
        inputBox.autocomplete = 'off';

        if (setting.input.type === 'number') {
            inputBox.min = setting.input.min;
            inputBox.step = '1';
        }
        if (setting.input.uppercase) {
            inputBox.addEventListener('input', () => {
                inputBox.value = inputBox.value.toUpperCase();
            });
        }

        container.appendChild(inputBox);
    }

    return { setting, container, checkBox, inputBox };
}

function saveOption(control, DEFAULT_SETTINGS) {
    const { setting, checkBox, inputBox } = control;
    GM_setValue(setting.key, checkBox.checked);

    if (!setting.input || !inputBox) {
        return;
    }

    const inputSetting = setting.input;
    const previousValue = GM_getValue(inputSetting.key, DEFAULT_SETTINGS[inputSetting.key]);
    const rawValue = inputBox.value.trim();
    let value = rawValue || previousValue;

    if (inputSetting.type === 'number') {
        const numericValue = Number(rawValue);
        value = rawValue !== '' && Number.isInteger(numericValue) && numericValue >= inputSetting.min
            ? numericValue
            : previousValue;
    } else if (inputSetting.uppercase && rawValue) {
        value = rawValue.toUpperCase();
    }

    GM_setValue(inputSetting.key, value);
    inputBox.value = value;
}
