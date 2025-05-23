let scriptData = [{ character: '角色1', expression: '普通', scene: '场景1', transition: false, content: '台词1' }];
let selectedRow = 0;
let nameCharMap = {};
let allCharacters = ['角色1']; // 用于存储所有角色名

// 在文件开头添加表情列表
const expressionList = ['普通', '微笑', '生气', '悲伤', '惊讶'];

// 在文件开头添加新的变量
let expressionMap = {};

// 在文件开头添加新的变量
let expressionCharMap = {};

// 在文件开头添加新的变量
let sceneList = [];
let sceneCharMap = {};

// 在文件开头添加新的变量
let sfxList = [];

// 修改读取文件的部分，添加读取表情字符对应.csv的逻辑
Promise.all([
    fetch('原版名字字符对应.csv').then(response => response.text()),
    fetch('原版表情字符对应.csv').then(response => response.text()),
    fetch('场景字符对应.csv').then(response => response.text()),
    fetch('sfx_list.json').then(response => response.json())
])
.then(([nameData, expressionData, sceneData, sfxData]) => {
    // 处理名字字符对应.csv
    const nameLines = nameData.split('\n');
    nameLines.forEach(line => {
        const [name, char] = line.split(',');
        if (name && char) {
            nameCharMap[name.trim()] = char.trim();
            if (!allCharacters.includes(name.trim())) {
                allCharacters.push(name.trim());
            }
        }
    });

    // 处理表情字符对应.csv
    const expressionLines = expressionData.split('\n');
    expressionLines.forEach(line => {
        const [character, expression, char] = line.split(',');
        if (character && expression) {
            if (!expressionMap[character.trim()]) {
                expressionMap[character.trim()] = [];
            }
            if (!expressionMap[character.trim()].includes(expression.trim())) {
                expressionMap[character.trim()].push(expression.trim());
            }
            if (char) {
                if (!expressionCharMap[character.trim()]) {
                    expressionCharMap[character.trim()] = {};
                }
                expressionCharMap[character.trim()][expression.trim()] = char.trim();
            }
        }
    });

    // 处理场景字符对应.csv
    const sceneLines = sceneData.split('\n');
    sceneLines.forEach(line => {
        const [scene, char] = line.split(',');
        if (scene && char) {
            sceneList.push(scene.trim());
            sceneCharMap[scene.trim()] = char.trim();
        }
    });

    // 处理音效文件列表
    sfxList = sfxData.sfxFiles
        .filter(file => file.endsWith('.wav') && file.startsWith('sfx_'))
        .map(file => file.slice(4, -4)); // 去掉 'sfx_' 前缀和 '.wav' 后缀

    // 填充音效菜单
    const sfxMenu = document.getElementById('sfx-menu');
    sfxList.forEach(sfx => {
        const button = document.createElement('button');
        button.textContent = sfx;
        button.dataset.value = sfx;
        sfxMenu.appendChild(button);
    });

    renderScript(); // 重新渲染脚本以更新角色名、表情和场景下拉框
})
.catch(error => {
    console.error('Error loading files:', error);
    alert('无法加载文件，请确文件存在并且可以访问。');
});

function renderScript() {
    const scriptBody = document.getElementById('script-body');
    scriptBody.innerHTML = '';
    scriptData.forEach((row, index) => {
        const tr = document.createElement('tr');
        
        if (row.isAction) {
            // 渲染动作行
            const paramInputs = row.params.map((param, paramIndex) => {
                const paramName = actFunctions[row.content].params[paramIndex];
                const defaultValue = actFunctions[row.content].defaults[paramName];
                return `<div>
                    <span>${paramName}: </span>
                    <input type="text" 
                        value="${param}" 
                        placeholder="${defaultValue !== undefined ? defaultValue : ''}"
                        style="color: ${param !== '' ? '#000' : '#999'};"
                        oninput="updateActionParam(${index}, ${paramIndex}, this.value)"
                        onclick="event.stopPropagation()">
                </div>`;
            }).join('');
            
            tr.innerHTML = `
                <td colspan="4">${row.content}</td>
                <td class="action-params">${paramInputs}</td>
                <td class="drag-handle">⋮⋮</td>
            `;
        } else {
            // 渲染普通行（保持原有的渲染逻辑）
            tr.innerHTML = `
                <td class="character">
                    <select onchange="updateCharacter(${index}, this.value)">
                        ${getCharacterOptions(row.character)}
                    </select>
                </td>
                <td class="expression">
                    <select onchange="updateExpression(${index}, this.value)">
                        ${getExpressionOptions(row.character, row.expression)}
                    </select>
                </td>
                <td class="scene">
                    <select onchange="updateScene(${index}, this.value)">
                        ${getSceneOptions(row.scene)}
                    </select>
                </td>
                <td class="transition">
                    <input type="checkbox" ${row.transition ? 'checked' : ''} onchange="updateTransition(${index}, this.checked)">
                </td>
                <td class="content" style="white-space: pre-wrap;">${stripTags(row.content)}</td>
                <td class="drag-handle">⋮⋮</td>
            `;
        }
        
        tr.dataset.index = index;
        if (index === selectedRow) {
            tr.classList.add('selected');
        }
        scriptBody.appendChild(tr);
    });
    updateInputBox();
}

function getCharacterOptions(selected) {
    return allCharacters.map(char => 
        `<option ${char === selected ? 'selected' : ''}>${char}</option>`
    ).join('');
}

function getExpressionOptions(character, selected) {
    const expressions = expressionMap[character] || expressionList;
    return expressions.map(expr => 
        `<option ${expr === selected ? 'selected' : ''}>${expr}</option>`
    ).join('');
}

function getSceneOptions(selected) {
    return sceneList.map(scene => 
        `<option ${scene === selected ? 'selected' : ''}>${scene}</option>`
    ).join('');
}

function updateInputBox() {
    const inputBox = document.getElementById('input-box');
    const previewBox = document.getElementById('preview-box');
    const row = scriptData[selectedRow];
    
    if (row.isAction) {
        inputBox.value = '';
        inputBox.disabled = true;  // 禁用输入框
        // 在预览框中居中显示提示文字
        previewBox.innerHTML = '<div style="text-align: center; width: 100%; padding-top: 50px;">正在编辑动作行</div>';
    } else {
        inputBox.disabled = false;  // 启用输入框
        const sceneText = row.transition ? `转${row.scene}` : row.scene;
        inputBox.value = `${row.character}(${row.expression})[${sceneText}]:${row.content}`;
        updatePreview();  // 只在非动作行时更新预览
    }
}

// 新增函数: 更新角色名
function updateCharacter(index, newCharacter) {
    scriptData[index].character = newCharacter;
    // 角色改变时，重置表情为该角色的第一个表情
    const newExpressions = expressionMap[newCharacter] || ['普通'];
    scriptData[index].expression = newExpressions[0];
    if (index === selectedRow) {
        updateInputBox();
    }
    updateScriptTable();
}

document.getElementById('script-body').addEventListener('click', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.parentElement.classList.contains('action-params')) {
        // 如果点击的是参数输入框，不要改变选中行
        return;
    }
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') {
        // 如果点击的是下拉选框或其选项，不要改变选中行
        return;
    }
    const tr = e.target.closest('tr');
    if (tr) {
        const rowIndex = parseInt(tr.dataset.index);
        // 只有在点击不同行时才触发选中事件
        if (rowIndex !== selectedRow) {
            selectedRow = rowIndex;
            renderScript();
        }
    }
});

// 修改 input 事件监听器
document.getElementById('input-box').addEventListener('input', (e) => {
    const inputValue = e.target.value;
    const colonIndex = inputValue.indexOf(':');
    if (colonIndex !== -1) {
        const character = inputValue.slice(0, colonIndex).trim();
        const content = inputValue.slice(colonIndex + 1);  // 保留所有内容，包括标签
        scriptData[selectedRow] = { character, content };
        updatePreview();
        updateScriptTable();
    }
});

document.getElementById('add-text').addEventListener('click', () => {
    const prevRow = scriptData[selectedRow];
    const newCharacter = prevRow?.character || '新角色';
    const newExpression = expressionMap[newCharacter] ? expressionMap[newCharacter][0] : '普通';
    const newScene = prevRow?.scene || sceneList[0] || '默认场景';
    const newRow = { 
        character: newCharacter, 
        expression: newExpression,
        scene: newScene,
        content: '新台词' 
    };
    scriptData.splice(selectedRow + 1, 0, newRow);
    selectedRow++;
    renderScript();
    updateInputBox();
});

document.getElementById('add-action').addEventListener('click', () => {
    const actionMenu = document.getElementById('action-menu');
    actionMenu.innerHTML = '';
    
    // 填充动作函数菜单
    Object.keys(actFunctions).forEach(funcName => {
        const button = document.createElement('button');
        button.textContent = funcName;
        button.style.backgroundColor = actFunctions[funcName].color;  // 设置背景颜色
        button.onclick = () => {
            const params = actFunctions[funcName].params;
            const newRow = { 
                character: 'action',
                expression: 'none',
                scene: scriptData[selectedRow]?.scene || sceneList[0] || '默认场景',
                transition: false,
                content: funcName,
                isAction: true,
                params: params.map(p => '')  // 为每个参数创建一个空字串
            };
            scriptData.splice(selectedRow + 1, 0, newRow);
            selectedRow++;
            renderScript();
            actionMenu.classList.add('hidden');
        };
        actionMenu.appendChild(button);
    });
    
    actionMenu.classList.remove('hidden');
});

document.getElementById('delete-row').addEventListener('click', () => {
    if (scriptData.length > 1) {
        scriptData.splice(selectedRow, 1);
        selectedRow = Math.min(selectedRow, scriptData.length - 1);
        renderScript();
    }
});

// 修改导出功能
document.getElementById('export').addEventListener('click', () => {
    let exportText = '';
    let inFunction = false;

    scriptData.forEach((row, index) => {
        if (row.isAction) {
            // 处理动作行
            if (!inFunction) {
                exportText += 'function() {\n';
                inFunction = true;
            }

            // 导出函数调用，过滤掉空参数，并为字符串添加引号
            const validParams = row.params.filter(param => param !== '').map(param => {
                // 如果参数不是数字，则添加引号
                return isNaN(param) ? `"${param}"` : param;
            });
            exportText += row.content + '(' + validParams.join(', ') + ');' + '\n';

            // 检查是否需要结束函数
            if (row.content.startsWith('act_ins')) {
                // 检查下一行
                const nextRow = index < scriptData.length - 1 ? scriptData[index + 1] : null;
                if (!nextRow || !nextRow.isAction) {
                    exportText += 'next();\n},\n';  // 添加逗号
                    inFunction = false;
                }
            } else if (row.content.startsWith('act_con') || row.content.startsWith('act_end')) {
                exportText += '},\n';  // 添加逗号
                inFunction = false;
            }
        } else {
            // 处理文本行，保持不变
            const characterChar = nameCharMap[row.character] || row.character;
            const expressionChar = expressionCharMap[row.character] && expressionCharMap[row.character][row.expression] 
                ? expressionCharMap[row.character][row.expression] 
                : row.expression;
            let sceneChar = sceneCharMap[row.scene] || row.scene;
            if (row.transition) {
                sceneChar = sceneChar.toLowerCase();
            }
            exportText += `"${characterChar}${expressionChar}${sceneChar}:${row.content.replace(/\n/g, '\\n')}",\n`;
        }
    });

    // 如果最后一行不是动作行，移除最后的换行和逗号，然后添加一个逗号
    if (!scriptData[scriptData.length - 1].isAction) {
        exportText = exportText.trimEnd().slice(0, -1) + ',';
    }

    navigator.clipboard.writeText(exportText);

    // 显示提示消息
    const hint = document.getElementById('copy-hint');
    hint.classList.remove('hidden');
    setTimeout(() => {
        hint.classList.add('show');
        setTimeout(() => {
            hint.classList.remove('show');
            setTimeout(() => {
                hint.classList.add('hidden');
            }, 500); // 等待淡出动画完成后隐藏元素
        }, 2000); // 显示2秒后开始淡出
    }, 0);
});

document.getElementById('save').addEventListener('click', () => {
    const csvContent = scriptData.map(row => {
        if (row.isAction) {
            // 动作行添加特殊标记，并保存参数
            return `action,${row.content},${row.scene},${row.transition},${row.params.join('|')}`;
        } else {
            // 普通行保原有格式
            return `${row.character},${row.expression},${row.scene},${row.transition},${row.content.replace(/,/g, '&#44;').replace(/\n/g, '\\n')}`;
        }
    }).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "script.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});

document.getElementById('load').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';  // 添加对 txt 文件的支持
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file,'UTF-8');
        reader.onload = readerEvent => {
            const content = readerEvent.target.result;
            
            if (file.name.endsWith('.csv')) {
                // 处理 CSV 文件（保持原有的处理逻辑）
                scriptData = content.split('\n').map(line => {
                    const [first, second, scene, transition, ...rest] = line.split(',');
                    
                    if (first === 'action') {
                        const params = rest.join(',').split('|');
                        return {
                            character: 'action',
                            expression: 'none',
                            scene: scene,
                            transition: transition === 'true',
                            content: second,
                            isAction: true,
                            params: params
                        };
                    } else {
                        const content = rest.join(',')
                            .replace(/&#44;/g, ',')
                            .replace(/\\n/g, '\n');
                        return {
                            character: first,
                            expression: second,
                            scene: scene,
                            transition: transition === 'true',
                            content: content
                        };
                    }
                });
            } else {
                // 处理 TXT 文件
                scriptData = [];
                const lines = content.split('\n');
                let currentFunction = null;
                let inFunction = false;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    
                    if (line === 'function() {') {
                        // 开始一个新的函数块
                        inFunction = true;
                        continue;
                    }
                    
                    if (line === '},' || line === '}') {
                        // 结束函数块
                        inFunction = false;
                        continue;
                    }
                    
                    if (line === 'next();') {
                        continue;
                    }
                    
                    if (inFunction) {
                        // 处理函数调用行
                        const match = line.match(/(\w+)\((.*)\);/);
                        if (match) {
                            const [, funcName, paramsStr] = match;
                            const params = paramsStr ? paramsStr.split(',').map(p => p.trim()) : [];
                            // 移除参数中的引号
                            const cleanParams = params.map(p => p.replace(/^"(.*)"$/, '$1'));
                            
                            scriptData.push({
                                character: 'action',
                                expression: 'none',
                                scene: scriptData.length > 0 ? scriptData[scriptData.length - 1].scene : '默认场景',
                                transition: false,
                                content: funcName,
                                isAction: true,
                                params: cleanParams
                            });
                        }
                    } else if (line && line !== 'next();') {
                        // 处理文本行
                        const match = line.match(/^"([^:]+?):(.*?)",?$/);
                        if (match) {
                            const [, prefix, content] = match;
                            
                            // 分离角色字符、表情字符和场景字符
                            const charStr = prefix.slice(0, 1);  // 第一个字符
                            const exprChar = prefix.slice(1, 2);  // 第二个字符
                            const sceneStr = prefix.slice(2);     // 剩余的字符
                            
                            // 修改这里：当场景字符为 "-" 时不判断转场
                            const isTransition = sceneStr !== '-' && sceneStr === sceneStr.toLowerCase();
                            const scene = isTransition ? sceneStr.toUpperCase() : sceneStr;
                            
                            // 从 nameCharMap 中找到对应的角色名
                            let character = '角色1';  // 默认值
                            for (const [name, char] of Object.entries(nameCharMap)) {
                                if (char === charStr) {  // 使用单个字符进行匹配
                                    character = name;
                                    break;
                                }
                            }

                            // 从 expressionCharMap 中找到对应的表情
                            let expression = '普通';  // 默认值
                            if (expressionCharMap[character]) {
                                for (const [expr, char] of Object.entries(expressionCharMap[character])) {
                                    if (char === exprChar) {  // 使用单个字符进行匹配
                                        expression = expr;
                                        break;
                                    }
                                }
                            }

                            // 从 sceneCharMap 中找到对应的场景
                            let sceneName = '默认场景';  // 默认值
                            for (const [name, char] of Object.entries(sceneCharMap)) {
                                if (char === scene) {  // 使用单个字符进行匹配
                                    sceneName = name;
                                    break;
                                }
                            }
                            
                            scriptData.push({
                                character: character,
                                expression: expression,
                                scene: sceneName,
                                transition: isTransition,
                                content: content.replace(/\\n/g, '\n')
                            });
                        }
                    }
                }
            }
            
            selectedRow = 0;
            renderScript();
        }
    }
    input.click();
});

// 初始化拖功能
let draggedRow = null;

document.getElementById('script-body').addEventListener('dragstart', (e) => {
    draggedRow = e.target.closest('tr');
    e.dataTransfer.setData('text/plain', '');
    setTimeout(() => draggedRow.style.display = 'none', 0);
});

document.getElementById('script-body').addEventListener('dragover', (e) => {
    e.preventDefault();
    const tr = e.target.closest('tr');
    if (tr && tr !== draggedRow) {
        const rect = tr.getBoundingClientRect();
        const midpoint = (rect.top + rect.bottom) / 2;
        if (e.clientY < midpoint) {
            tr.parentNode.insertBefore(draggedRow, tr);
        } else {
            tr.parentNode.insertBefore(draggedRow, tr.nextSibling);
        }
    }
});

document.getElementById('script-body').addEventListener('dragend', () => {
    draggedRow.style.display = '';
    scriptData = Array.from(document.querySelectorAll('#script-body tr')).map(tr => ({
        character: tr.querySelector('select').value,
        content: scriptData[tr.dataset.index].content  // 保留原始内容，包括标签
    }));
    selectedRow = scriptData.findIndex(row => 
        row.character === draggedRow.querySelector('select').value && 
        stripTags(row.content) === draggedRow.querySelector('.content').textContent
    );
    renderScript();
});

// 修改键盘上下键选择行的部分
document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName !== 'TEXTAREA') {
        const scriptBody = document.getElementById('script-body');
        const rows = scriptBody.getElementsByTagName('tr');
        
        if (e.key === 'ArrowUp' && selectedRow > 0) {
            selectedRow--;
            // 先更新选中状态，再滚动
            const oldSelectedTr = rows[selectedRow + 1];
            const newSelectedTr = rows[selectedRow];
            if (oldSelectedTr) oldSelectedTr.classList.remove('selected');
            if (newSelectedTr) newSelectedTr.classList.add('selected');
            
            if (newSelectedTr) {
                newSelectedTr.scrollIntoView({ block: 'center', behavior: 'auto' });
            }
            
            updateInputBox();
        } else if (e.key === 'ArrowDown' && selectedRow < scriptData.length - 1) {
            selectedRow++;
            // 先更新选中状态，再滚动
            const oldSelectedTr = rows[selectedRow - 1];
            const newSelectedTr = rows[selectedRow];
            if (oldSelectedTr) oldSelectedTr.classList.remove('selected');
            if (newSelectedTr) newSelectedTr.classList.add('selected');
            
            if (newSelectedTr) {
                newSelectedTr.scrollIntoView({ block: 'center', behavior: 'auto' });
            }
            
            updateInputBox();
        }
    }
});

renderScript();

// 在文件末尾添加以下内容

const shakeButton = document.getElementById('shake-button');
const shakeMenu = document.getElementById('shake-menu');

// 修 shakeButton 的点击事件监听器
shakeButton.addEventListener('click', () => {
    const inputBox = document.getElementById('input-box');
    const start = inputBox.selectionStart;
    const end = inputBox.selectionEnd;
    
    shakeMenu.classList.toggle('hidden');
    
    // 保存当前的光标位置
    shakeMenu.dataset.start = start;
    shakeMenu.dataset.end = end;

    // 保持输入框的焦点和选中状态
    inputBox.focus();
    inputBox.setSelectionRange(start, end);
});

// 修改 shakeMenu 的点击事件监听器
shakeMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const shakeValue = e.target.dataset.value;
        const inputBox = document.getElementById('input-box');
        const start = parseInt(shakeMenu.dataset.start);
        const end = parseInt(shakeMenu.dataset.end);
        const text = inputBox.value;

        let newText;
        if (start === end) {
            // 没有选中文本,在光标处插入标签
            newText = text.slice(0, start) + `<shake=${shakeValue}>` + text.slice(start);
            inputBox.value = newText;
            inputBox.setSelectionRange(start + 9 + shakeValue.length, start + 9 + shakeValue.length);
        } else {
            // 选中了文本,在选中文本的开头和结尾插入标签
            newText = text.slice(0, start) + `<shake=${shakeValue}>` + text.slice(start, end) + '<shake=0>' + text.slice(end);
            inputBox.value = newText;
            inputBox.setSelectionRange(start, end + 18 + shakeValue.length);
        }

        shakeMenu.classList.add('hidden');
        saveContent(newText);
        updatePreview();
        updateScriptTable();
        
        // 保持输入框的焦点
        inputBox.focus();
    }
});

const colorButton = document.getElementById('color-button');
const colorMenu = document.getElementById('color-menu');

colorButton.addEventListener('click', () => {
    const inputBox = document.getElementById('input-box');
    const start = inputBox.selectionStart;
    const end = inputBox.selectionEnd;
    
    colorMenu.classList.toggle('hidden');
    
    // 保存当前的光标位置
    colorMenu.dataset.start = start;
    colorMenu.dataset.end = end;

    // 保持输入框的焦点和选中状态
    inputBox.focus();
    inputBox.setSelectionRange(start, end);
});

colorMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const colorValue = e.target.dataset.value;
        const inputBox = document.getElementById('input-box');
        const start = parseInt(colorMenu.dataset.start);
        const end = parseInt(colorMenu.dataset.end);
        const text = inputBox.value;

        let newText;
        if (start === end) {
            // 没有选中文本,在光标处插入标签
            newText = text.slice(0, start) + `<color=${colorValue}>` + text.slice(start);
            inputBox.value = newText;
            inputBox.setSelectionRange(start + 9 + colorValue.length, start + 9 + colorValue.length);
        } else {
            // 选中了文本,在选中文本的开头和结尾插入标签
            let prevColor = 'white';
            // 查找前一个颜色标签
            const prevColorMatch = text.slice(0, start).match(/<color=(\w+)>[^<]*$/);
            if (prevColorMatch) {
                prevColor = prevColorMatch[1];
            }
            newText = text.slice(0, start) + `<color=${colorValue}>` + text.slice(start, end) + `<color=${prevColor}>` + text.slice(end);
            inputBox.value = newText;
            inputBox.setSelectionRange(start, end + 18 + colorValue.length + prevColor.length);
        }

        colorMenu.classList.add('hidden');
        saveContent(newText);
        updatePreview();
        updateScriptTable();
        
        // 保持输入框的焦点
        inputBox.focus();
    }
});

const alphaButton = document.getElementById('alpha-button');
const alphaMenu = document.getElementById('alpha-menu');
const alphaSlider = document.getElementById('alpha-slider');
const alphaConfirm = document.getElementById('alpha-confirm');

// 在 alphaSlider 相关代码附近添加以下内容

const alphaValueDisplay = document.getElementById('alpha-value-display');

alphaSlider.addEventListener('input', () => {
    alphaValueDisplay.textContent = alphaSlider.value;
});

// 修改 alphaButton 的点击事件监听器，确保在打开单时显示正确的初始值
alphaButton.addEventListener('click', () => {
    const inputBox = document.getElementById('input-box');
    const start = inputBox.selectionStart;
    const end = inputBox.selectionEnd;
    
    alphaMenu.classList.toggle('hidden');
    
    // 保存当前的光标位置
    alphaMenu.dataset.start = start;
    alphaMenu.dataset.end = end;

    // 更新显示的值
    alphaValueDisplay.textContent = alphaSlider.value;

    // 保持输入框的焦点和选中状态
    inputBox.focus();
    inputBox.setSelectionRange(start, end);
});

alphaConfirm.addEventListener('click', () => {
    const alphaValue = alphaSlider.value;
    const inputBox = document.getElementById('input-box');
    const start = parseInt(alphaMenu.dataset.start);
    const end = parseInt(alphaMenu.dataset.end);
    const text = inputBox.value;

    let newText;
    if (start === end) {
        // 没有选中本,在标处插入标签
        newText = text.slice(0, start) + `<alpha=${alphaValue}>` + text.slice(start);
        inputBox.value = newText;
        inputBox.setSelectionRange(start + 9 + alphaValue.length, start + 9 + alphaValue.length);
    } else {
        // 选中了文本,在选中文本的开头和结尾插入标签
        let prevAlpha = '1';
        // 查找前一个透明度标签
        const prevAlphaMatch = text.slice(0, start).match(/<alpha=(\d+(\.\d+)?)>[^<]*$/);
        if (prevAlphaMatch) {
            prevAlpha = prevAlphaMatch[1];
        }
        newText = text.slice(0, start) + `<alpha=${alphaValue}>` + text.slice(start, end) + `<alpha=${prevAlpha}>` + text.slice(end);
        inputBox.value = newText;
        inputBox.setSelectionRange(start, end + 18 + alphaValue.length + prevAlpha.length);
    }

    alphaMenu.classList.add('hidden');
    saveContent(newText);
    updatePreview();
    updateScriptTable();
    
    // 保持输入框的焦点
    inputBox.focus();
});

const alignButton = document.getElementById('align-button');
const alignMenu = document.getElementById('align-menu');

alignButton.addEventListener('click', () => {
    const inputBox = document.getElementById('input-box');
    const start = inputBox.selectionStart;
    const end = inputBox.selectionEnd;
    
    alignMenu.classList.toggle('hidden');
    
    // 保存当前的光标位置
    alignMenu.dataset.start = start;
    alignMenu.dataset.end = end;

    // 保持输入框的焦点和选中状态
    inputBox.focus();
    inputBox.setSelectionRange(start, end);
});

alignMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const alignValue = e.target.dataset.value;
        const inputBox = document.getElementById('input-box');
        const text = inputBox.value;
        const colonIndex = text.indexOf(':');

        if (colonIndex !== -1) {
            let content = text.slice(colonIndex + 1).trim();
            const character = text.slice(0, colonIndex).trim();

            // 删除现有的 align 标签
            content = content.replace(/^<align=(left|centre)>/, '');

            // 插入新的 align 标签
            content = `<align=${alignValue}>` + content;

            const newText = `${character}:${content}`;
            inputBox.value = newText;
            
            alignMenu.classList.add('hidden');
            saveContent(newText);
            updatePreview();
            updateScriptTable();
            
            // 保持输入框的焦点
            inputBox.focus();
        }
    }
});

// 改 updatePreview 函数
function updatePreview() {
    const previewBox = document.getElementById('preview-box');
    const text = document.getElementById('input-box').value;
    const colonIndex = text.indexOf(':');
    if (colonIndex !== -1) {
        const content = text.slice(colonIndex + 1).trim();
        let html = '';
        let currentShake = 0;
        let currentColor = 'white';
        let currentAlpha = 1;
        let currentAlign = 'left';
        let i = 0;
        while (i < content.length) {
            if (content.startsWith('<shake=', i)) {
                const endIndex = content.indexOf('>', i);
                currentShake = parseInt(content.slice(i + 7, endIndex));
                i = endIndex + 1;
            } else if (content.startsWith('<color=', i)) {
                const endIndex = content.indexOf('>', i);
                currentColor = content.slice(i + 7, endIndex);
                i = endIndex + 1;
            } else if (content.startsWith('<alpha=', i)) {
                const endIndex = content.indexOf('>', i);
                currentAlpha = parseFloat(content.slice(i + 7, endIndex));
                i = endIndex + 1;
            } else if (content.startsWith('<align=', i)) {
                const endIndex = content.indexOf('>', i);
                currentAlign = content.slice(i + 7, endIndex);
                i = endIndex + 1;
            } else if (content.startsWith('[speed=', i)) {
                const endIndex = content.indexOf(']', i);
                i = endIndex + 1;
            } else if (content.startsWith('[halt=', i)) {
                const endIndex = content.indexOf(']', i);
                i = endIndex + 1;
            } else if (content.startsWith('[sfx=', i)) {
                const endIndex = content.indexOf(']', i);
                i = endIndex + 1;
            } else if (content.startsWith('[flash=', i)) {
                const endIndex = content.indexOf(']', i);
                i = endIndex + 1;
            } else if (content.startsWith('[scrn_shake=', i)) {
                const endIndex = content.indexOf(']', i);
                i = endIndex + 1;
            } else if (content[i] === '\n') {
                html += '<br>';
                i++;
            } else {
                const shakeClass = currentShake > 0 ? `shake${Math.min(currentShake, 5)}` : '';
                const char = content[i] === ' ' ? '&nbsp;' : content[i];
                html += `<span class="${shakeClass}" style="color: ${currentColor}; opacity: ${currentAlpha};">${char}</span>`;
                i++;
            }
        }
        previewBox.innerHTML = html;
        previewBox.style.textAlign = currentAlign === 'centre' ? 'center' : 'left';
    }
}

// 确保在页面加载时调用次 updatePreview
document.addEventListener('DOMContentLoaded', updatePreview);

// 新增 updateScriptTable 函数
function updateScriptTable() {
    const scriptBody = document.getElementById('script-body');
    const rows = scriptBody.getElementsByTagName('tr');
    const row = rows[selectedRow];
    if (row) {
        const characterSelect = row.querySelector('.character select');
        const expressionSelect = row.querySelector('.expression select');
        const sceneSelect = row.querySelector('.scene select');
        const transitionCheckbox = row.querySelector('.transition input');
        const contentCell = row.querySelector('.content');
        
        if (characterSelect) {
            characterSelect.value = scriptData[selectedRow].character;
            characterSelect.innerHTML = getCharacterOptions(scriptData[selectedRow].character);
        }
        if (expressionSelect) {
            expressionSelect.innerHTML = getExpressionOptions(scriptData[selectedRow].character, scriptData[selectedRow].expression);
            expressionSelect.value = scriptData[selectedRow].expression;
        }
        if (sceneSelect) {
            sceneSelect.value = scriptData[selectedRow].scene;
        }
        if (transitionCheckbox) {
            transitionCheckbox.checked = scriptData[selectedRow].transition;
        }
        if (contentCell) {
            contentCell.textContent = stripTags(scriptData[selectedRow].content);
        }
    }
}

// 加新的数来保持选择状态
function maintainSelection() {
    const inputBox = document.getElementById('input-box');
    const start = inputBox.selectionStart;
    const end = inputBox.selectionEnd;

    // 使用 setTimeout 来确保在失去焦点后仍能设选择范围
    setTimeout(() => {
        inputBox.setSelectionRange(start, end);
    }, 0);
}

// 为入框添加失去焦点事件监听器
document.getElementById('input-box').addEventListener('blur', maintainSelection);

// 在文件中添加以下函数和事件监听器

function selectTag(inputBox, start) {
    const text = inputBox.value;
    let tagStart = start;
    let tagEnd = start;

    // 向前查找 '<' 或 '['，并包含它
    while (tagStart > 0 && text[tagStart - 1] !== '<' && text[tagStart - 1] !== '[') {
        tagStart--;
    }
    if (tagStart > 0 && (text[tagStart - 1] === '<' || text[tagStart - 1] === '[')) {
        tagStart--;
    }

    // 向后查找 '>' 或 ']'
    while (tagEnd < text.length && text[tagEnd] !== '>' && text[tagEnd] !== ']') {
        tagEnd++;
    }

    if (tagEnd < text.length) {
        tagEnd++; // 包含 '>' 或 ']'
    }

    return { start: tagStart, end: tagEnd };
}

document.getElementById('input-box').addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
        const inputBox = e.target;
        const start = inputBox.selectionStart;
        const end = inputBox.selectionEnd;

        if (start === end && start > 0) {
            const prevChar = inputBox.value[start - 1];
            if (prevChar === '>' || prevChar === '<' || prevChar === ']' || prevChar === '[') {
                const tag = selectTag(inputBox, start - 1);
                
                if (tag.start < tag.end) {
                    e.preventDefault();
                    inputBox.setSelectionRange(tag.start, tag.end);
                }
            }
        }
    }
});

// 修改 input 事件监听器
document.getElementById('input-box').addEventListener('input', (e) => {
    const inputValue = e.target.value;
    const colonIndex = inputValue.indexOf(':');
    if (colonIndex !== -1) {
        const character = inputValue.slice(0, colonIndex).trim();
        const content = inputValue.slice(colonIndex + 1);  // 保留所有内容，包括标签
        scriptData[selectedRow] = { character, content };
        updatePreview();
        updateScriptTable();
    }
});

// 在文件末尾添以下内容

const playButton = document.getElementById('play-button');

playButton.addEventListener('click', () => {
    const previewBox = document.getElementById('preview-box');
    const text = document.getElementById('input-box').value;
    const colonIndex = text.indexOf(':');
    if (colonIndex !== -1) {
        const content = text.slice(colonIndex + 1).trim();
        previewBox.innerHTML = '';
        typeWriter(content, previewBox);
    }
});

function typeWriter(content, previewBox) {
    let i = 0;
    let currentShake = 0;
    let currentColor = 'white';
    let currentAlpha = 1;
    let currentAlign = 'left';
    let currentSpeed = 50; // 默认速度（对应 mid）
    let html = '';

    function addNextChar() {
        while (i < content.length) {
            if (content.startsWith('<shake=', i)) {
                const endIndex = content.indexOf('>', i);
                currentShake = parseInt(content.slice(i + 7, endIndex));
                i = endIndex + 1;
            } else if (content.startsWith('<color=', i)) {
                const endIndex = content.indexOf('>', i);
                currentColor = content.slice(i + 7, endIndex);
                i = endIndex + 1;
            } else if (content.startsWith('<alpha=', i)) {
                const endIndex = content.indexOf('>', i);
                currentAlpha = parseFloat(content.slice(i + 7, endIndex));
                i = endIndex + 1;
            } else if (content.startsWith('<align=', i)) {
                const endIndex = content.indexOf('>', i);
                currentAlign = content.slice(i + 7, endIndex);
                previewBox.style.textAlign = currentAlign === 'centre' ? 'center' : 'left';
                i = endIndex + 1;
            } else if (content.startsWith('[speed=', i)) {
                const endIndex = content.indexOf(']', i);
                const speedValue = content.slice(i + 7, endIndex);
                switch (speedValue) {
                    case 'slow': currentSpeed = 200; break;
                    case 'mid': currentSpeed = 50; break;
                    case 'fast': currentSpeed = 25; break;
                    case 'urge': currentSpeed = 10; break;
                }
                i = endIndex + 1;
            } else if (content.startsWith('[halt=', i)) {
                const endIndex = content.indexOf(']', i);
                const haltFrames = parseInt(content.slice(i + 6, endIndex));
                i = endIndex + 1;
                setTimeout(() => {
                    addNextChar();
                }, haltFrames * 16.7); // 将帧数转换为毫秒
                return;
            } else if (content.startsWith('[sfx=', i)) {
                const endIndex = content.indexOf(']', i);
                const sfxName = content.slice(i + 5, endIndex);
                playSfx(sfxName);
                i = endIndex + 1;
            } else if (content.startsWith('[flash=', i)) {
                const endIndex = content.indexOf(']', i);
                i = endIndex + 1;
            } else if (content.startsWith('[scrn_shake=', i)) {
                const endIndex = content.indexOf(']', i);
                i = endIndex + 1;
            } else if (content[i] === '\n') {
                html += '<br>';
                i++;
                break;
            } else {
                const shakeClass = currentShake > 0 ? `shake${Math.min(currentShake, 5)}` : '';
                html += `<span class="${shakeClass}" style="color: ${currentColor}; opacity: ${currentAlpha};">${content[i]}</span>`;
                i++;
                break;
            }
        }

        previewBox.innerHTML = html;

        if (i < content.length) {
            setTimeout(addNextChar, currentSpeed);
        }
    }

    addNextChar();
}

// 添加播放音效的函数
function playSfx(sfxName) {
    const audio = new Audio(`sfxs/sfx_${sfxName}.wav`);
    audio.play().catch(error => console.error('Error playing audio:', error));
}

// 修改 updatePreview 函数
function updatePreview() {
    const previewBox = document.getElementById('preview-box');
    const text = document.getElementById('input-box').value;
    const colonIndex = text.indexOf(':');
    if (colonIndex !== -1) {
        const content = text.slice(colonIndex + 1).trim();
        let html = '';
        let currentShake = 0;
        let currentColor = 'white';
        let currentAlpha = 1;
        let currentAlign = 'left';
        let i = 0;
        while (i < content.length) {
            if (content.startsWith('<shake=', i)) {
                const endIndex = content.indexOf('>', i);
                currentShake = parseInt(content.slice(i + 7, endIndex));
                i = endIndex + 1;
            } else if (content.startsWith('<color=', i)) {
                const endIndex = content.indexOf('>', i);
                currentColor = content.slice(i + 7, endIndex);
                i = endIndex + 1;
            } else if (content.startsWith('<alpha=', i)) {
                const endIndex = content.indexOf('>', i);
                currentAlpha = parseFloat(content.slice(i + 7, endIndex));
                i = endIndex + 1;
            } else if (content.startsWith('<align=', i)) {
                const endIndex = content.indexOf('>', i);
                currentAlign = content.slice(i + 7, endIndex);
                i = endIndex + 1;
            } else if (content.startsWith('[speed=', i)) {
                const endIndex = content.indexOf(']', i);
                i = endIndex + 1;
            } else if (content.startsWith('[halt=', i)) {
                const endIndex = content.indexOf(']', i);
                i = endIndex + 1;
            } else if (content.startsWith('[sfx=', i)) {
                const endIndex = content.indexOf(']', i);
                i = endIndex + 1;
            } else if (content.startsWith('[flash=', i)) {
                const endIndex = content.indexOf(']', i);
                i = endIndex + 1;
            } else if (content.startsWith('[scrn_shake=', i)) {
                const endIndex = content.indexOf(']', i);
                i = endIndex + 1;
            } else if (content[i] === '\n') {
                html += '<br>';
                i++;
            } else {
                const shakeClass = currentShake > 0 ? `shake${Math.min(currentShake, 5)}` : '';
                const char = content[i] === ' ' ? '&nbsp;' : content[i];
                html += `<span class="${shakeClass}" style="color: ${currentColor}; opacity: ${currentAlpha};">${char}</span>`;
                i++;
            }
        }
        previewBox.innerHTML = html;
        previewBox.style.textAlign = currentAlign === 'centre' ? 'center' : 'left';
    }
}

const speedButton = document.getElementById('speed-button');
const speedMenu = document.getElementById('speed-menu');

speedButton.addEventListener('click', () => {
    const inputBox = document.getElementById('input-box');
    const start = inputBox.selectionStart;
    const end = inputBox.selectionEnd;
    
    speedMenu.classList.toggle('hidden');
    
    // 保存当前的光标位置
    speedMenu.dataset.start = start;
    speedMenu.dataset.end = end;

    // 保持输入框的焦点和选中状态
    inputBox.focus();
    inputBox.setSelectionRange(start, end);
});

speedMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const speedValue = e.target.dataset.value;
        const inputBox = document.getElementById('input-box');
        const start = parseInt(speedMenu.dataset.start);
        const end = parseInt(speedMenu.dataset.end);
        const text = inputBox.value;

        let newText;
        if (start === end) {
            // 没有选中文本,在光标处插入标签
            newText = text.slice(0, start) + `[speed=${speedValue}]` + text.slice(start);
            inputBox.value = newText;
            inputBox.setSelectionRange(start + speedValue.length + 8, start + speedValue.length + 8);
        } else {
            // 选中了文��,在选中文本的开头插入标签
            newText = text.slice(0, start) + `[speed=${speedValue}]` + text.slice(start);
            inputBox.value = newText;
            inputBox.setSelectionRange(start, end + speedValue.length + 8);
        }

        speedMenu.classList.add('hidden');
        saveContent(newText);
        updatePreview();
        updateScriptTable();
        
        // 保持输入框的焦点
        inputBox.focus();
    }
});

const haltButton = document.getElementById('halt-button');
const haltMenu = document.getElementById('halt-menu');

haltButton.addEventListener('click', () => {
    const inputBox = document.getElementById('input-box');
    const start = inputBox.selectionStart;
    const end = inputBox.selectionEnd;
    
    haltMenu.classList.toggle('hidden');
    
    // 保存当前的光标位置
    haltMenu.dataset.start = start;
    haltMenu.dataset.end = end;

    // 保持输入框的焦点和选中状态
    inputBox.focus();
    inputBox.setSelectionRange(start, end);
});

haltMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const haltValue = e.target.dataset.value;
        const inputBox = document.getElementById('input-box');
        const start = parseInt(haltMenu.dataset.start);
        const end = parseInt(haltMenu.dataset.end);
        const text = inputBox.value;

        let newText;
        if (start === end) {
            // 没有选中本,在光标处插入标签
            newText = text.slice(0, start) + `[halt=${haltValue}]` + text.slice(start);
            inputBox.value = newText;
            inputBox.setSelectionRange(start + haltValue.length + 7, start + haltValue.length + 7);
        } else {
            // 选中了文本,在选中文本的开头插入标签
            newText = text.slice(0, start) + `[halt=${haltValue}]` + text.slice(start);
            inputBox.value = newText;
            inputBox.setSelectionRange(start, end + haltValue.length + 7);
        }

        haltMenu.classList.add('hidden');
        saveContent(newText);
        updatePreview();
        updateScriptTable();
        
        // 保持输入框的焦点
        inputBox.focus();
    }
});

// 添加一个辅助函数来转义 HTML
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function stripTags(content) {
    return content.replace(/<[^>]+>|\[.*?\]/g, '');
}

// 修改 saveContent 函数
function saveContent(newText) {
    // 如果当前选中的是动行，直接返回，不做任何处理
    if (scriptData[selectedRow].isAction) {
        return;
    }

    const match = newText.match(/^(.+?)\((.+?)\)\[(.+?)\]:(.*)$/s);
    if (match) {
        const [, character, expression, scene, content] = match;
        const isTransition = scene.startsWith('转');
        scriptData[selectedRow] = { 
            ...scriptData[selectedRow], // 保留原有的所有属性
            character: character.trim(), 
            expression: expression.trim(), 
            scene: isTransition ? scene.slice(1).trim() : scene.trim(),
            transition: isTransition,
            content: content.trim() 
        };
    } else {
        // 如果没有匹配到完整的格式，保留原有的角色名、表情和场景信息
        const colonIndex = newText.indexOf(':');
        if (colonIndex !== -1) {
            const content = newText.slice(colonIndex + 1).trim();
            scriptData[selectedRow] = { 
                ...scriptData[selectedRow], // 保留有的所有属性
                content 
            };
        }
    }
}

// 修改 input 件监听器
document.getElementById('input-box').addEventListener('input', (e) => {
    const inputValue = e.target.value;
    saveContent(inputValue);
    updatePreview();
    updateScriptTable();
});

// 添加 updateExpression 函数
function updateExpression(index, newExpression) {
    scriptData[index].expression = newExpression;
    if (index === selectedRow) {
        updateInputBox();
    }
    updateScriptTable();
}

// 添加新的函数来更新场景
function updateScene(index, newScene) {
    scriptData[index].scene = newScene;
    if (index === selectedRow) {
        updateInputBox();
    }
    updateScriptTable();
}

// 添加新的函数来更新转场状态
function updateTransition(index, isTransition) {
    scriptData[index].transition = isTransition;
    if (index === selectedRow) {
        updateInputBox();
    }
    updateScriptTable();
}

const sfxButton = document.getElementById('sfx-button');
const sfxMenu = document.getElementById('sfx-menu');

sfxButton.addEventListener('click', () => {
    const inputBox = document.getElementById('input-box');
    const start = inputBox.selectionStart;
    const end = inputBox.selectionEnd;
    
    sfxMenu.classList.toggle('hidden');
    
    // 保存当前的光标位置
    sfxMenu.dataset.start = start;
    sfxMenu.dataset.end = end;

    // 保持输入框的焦点和选中状态
    inputBox.focus();
    inputBox.setSelectionRange(start, end);
});

sfxMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const sfxValue = e.target.dataset.value;
        const inputBox = document.getElementById('input-box');
        const start = parseInt(sfxMenu.dataset.start);
        const end = parseInt(sfxMenu.dataset.end);
        const text = inputBox.value;

        let newText;
        if (start === end) {
            // 没有选中文本,在光标处插入标签
            newText = text.slice(0, start) + `[sfx=${sfxValue}]` + text.slice(start);
            inputBox.value = newText;
            inputBox.setSelectionRange(start + sfxValue.length + 6, start + sfxValue.length + 6);
        } else {
            // 选中了文本,在选中本的开头插入标签
            newText = text.slice(0, start) + `[sfx=${sfxValue}]` + text.slice(start);
            inputBox.value = newText;
            inputBox.setSelectionRange(start, end + sfxValue.length + 6);
        }

        sfxMenu.classList.add('hidden');
        saveContent(newText);
        updatePreview();
        updateScriptTable();
        
        // 保持输入框的焦点
        inputBox.focus();
    }
});

const flashButton = document.getElementById('flash-button');
const flashMenu = document.getElementById('flash-menu');

flashButton.addEventListener('click', () => {
    const inputBox = document.getElementById('input-box');
    const start = inputBox.selectionStart;
    const end = inputBox.selectionEnd;
    
    flashMenu.classList.toggle('hidden');
    
    // 保存当前的光标位置
    flashMenu.dataset.start = start;
    flashMenu.dataset.end = end;

    // 保持输入框的焦点和选中状态
    inputBox.focus();
    inputBox.setSelectionRange(start, end);
});

flashMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const flashValue = e.target.dataset.value;
        const inputBox = document.getElementById('input-box');
        const start = parseInt(flashMenu.dataset.start);
        const end = parseInt(flashMenu.dataset.end);
        const text = inputBox.value;

        let newText;
        if (start === end) {
            // 没有选中文本,在光标处插入标签
            newText = text.slice(0, start) + `[flash=${flashValue}]` + text.slice(start);
            inputBox.value = newText;
            // 修改这里：将光标位置设置在 ] 后面
            inputBox.setSelectionRange(start + flashValue.length + 8, start + flashValue.length + 8);
        } else {
            // 选中了文本,在选中文本的开头插入标签
            newText = text.slice(0, start) + `[flash=${flashValue}]` + text.slice(start);
            inputBox.value = newText;
            // 修改这里：将选区结束位置向后移动到 ] 后面
            inputBox.setSelectionRange(start, end + flashValue.length + 8);
        }

        flashMenu.classList.add('hidden');
        saveContent(newText);
        updatePreview();
        updateScriptTable();
        
        // 保持输入框的焦点
        inputBox.focus();
    }
});

const scrnShakeButton = document.getElementById('scrn-shake-button');
const scrnShakeMenu = document.getElementById('scrn-shake-menu');

scrnShakeButton.addEventListener('click', () => {
    const inputBox = document.getElementById('input-box');
    const start = inputBox.selectionStart;
    const end = inputBox.selectionEnd;
    
    scrnShakeMenu.classList.toggle('hidden');
    
    // 保存当前的光标位置
    scrnShakeMenu.dataset.start = start;
    scrnShakeMenu.dataset.end = end;

    // 保持输入框的焦点和选中状态
    inputBox.focus();
    inputBox.setSelectionRange(start, end);
});

scrnShakeMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const shakeValue = e.target.dataset.value;
        const inputBox = document.getElementById('input-box');
        const start = parseInt(scrnShakeMenu.dataset.start);
        const end = parseInt(scrnShakeMenu.dataset.end);
        const text = inputBox.value;

        let newText;
        if (start === end) {
            // 没有选中文本,在光标处插入标签
            newText = text.slice(0, start) + `[scrn_shake=${shakeValue}]` + text.slice(start);
            inputBox.value = newText;
            // 修改这里：将光标位置设置在 ] 后面
            inputBox.setSelectionRange(start + shakeValue.length + 13, start + shakeValue.length + 13);
        } else {
            // 选中了文本,在选中文本的开头插入标签
            newText = text.slice(0, start) + `[scrn_shake=${shakeValue}]` + text.slice(start);
            inputBox.value = newText;
            // 修改这里：将选区结束位置向后移动到 ] 后面
            inputBox.setSelectionRange(start, end + shakeValue.length + 13);
        }

        scrnShakeMenu.classList.add('hidden');
        saveContent(newText);
        updatePreview();
        updateScriptTable();
        
        // 保持输入框的焦点
        inputBox.focus();
    }
});

// 修改更新动作参数的函数
function updateActionParam(rowIndex, paramIndex, value) {
    scriptData[rowIndex].params[paramIndex] = value;
    // 更新输入框的颜色
    const inputs = document.querySelectorAll(`tr[data-index="${rowIndex}"] .action-params input`);
    if (inputs && inputs[paramIndex]) {
        inputs[paramIndex].style.color = value === '' ? '#999' : '#000';
    }
}

// 在文件开头添加所有菜单的引用
const allMenus = [
    'shake-menu',
    'color-menu',
    'alpha-menu',
    'align-menu',
    'speed-menu',
    'halt-menu',
    'sfx-menu',
    'flash-menu',
    'scrn-shake-menu',
    'action-menu'
].map(id => document.getElementById(id));

// 添加点击件监听器到 document
document.addEventListener('click', (e) => {
    // 如果点击的是按钮本身，不处理（让按钮自己的事件处理器处理）
    if (e.target.closest('button') && 
        (e.target.closest('button').id.endsWith('-button') || 
         e.target.closest('button').parentElement.classList.contains('hidden') === false)) {
        return;
    }

    // 隐藏所有菜单
    allMenus.forEach(menu => {
        if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
});

// 阻止菜单内部的点击事件冒到 document
allMenus.forEach(menu => {
    if (menu) {
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
});

