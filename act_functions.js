let actFunctions = {
    // 添加默认的 act_test 函数
    'act_test': {
        params: ['arg1', 'arg2'],
        defaults: {},
        color: '#ffffff'  // 默认白色
    }
};

// 定义区域对应的颜色
const regionColors = {
    'Plot & Chain': '#ffcccc',    // 浅红色
    'Drawer': '#ccffcc',          // 浅绿色
    'Screen Drawer': '#ccffff',   // 浅青色
    'Music': '#cce5ff',           // 浅蓝色
    'Animations': '#ffe5cc',      // 浅橙色
    'Textbar': '#e5ccff',         // 浅紫色
    'Court Records': '#d4c5aa'    // 浅褐色
};

// 添加 CSS 样式来处理悬停效果
const style = document.createElement('style');
style.textContent = `
    #action-menu button:hover {
        filter: brightness(0.9);  /* 使颜色略微变暗 */
    }
`;
document.head.appendChild(style);

fetch('act函数辞典.txt')
    .then(response => response.text())
    .then(text => {
        // 先将文本按行分割
        const lines = text.split('\n');
        let currentRegion = null;

        // 遍历每一行
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // 检查是否是区域开始标记
            if (line.startsWith('#region')) {
                currentRegion = line.replace('#region', '').trim();
                continue;
            }

            // 检查是否是区域结束标记
            if (line === '#endregion') {
                currentRegion = null;
                continue;
            }

            // 使用正则表达式匹配函数定义
            const functionMatch = line.match(/function\s+(\w+)\s*\((.*?)\)\s*{/);
            if (functionMatch) {
                const functionName = functionMatch[1];
                const paramsStr = functionMatch[2];
                
                // 解析参数和默认值
                const params = [];
                const defaults = {};
                
                paramsStr.split(',').forEach(param => {
                    param = param.trim();
                    if (param) {
                        const [paramName, defaultValue] = param.split('=').map(s => s.trim());
                        params.push(paramName);
                        if (defaultValue !== undefined) {
                            defaults[paramName] = defaultValue;
                        }
                    }
                });
                
                actFunctions[functionName] = {
                    params: params,
                    defaults: defaults,
                    color: currentRegion ? regionColors[currentRegion] : '#ffffff'
                };
            }
        }
    })
    .catch(error => {
        console.error('Error loading act functions dictionary:', error);
        alert('无法加载act函数辞典，请确保文件存在并且可以访问。');
    }); 