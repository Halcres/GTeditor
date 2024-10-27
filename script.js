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

// 修改读取文件的部分，添加读取表情字符对应.csv的逻辑
Promise.all([
    fetch('名字字符对应.csv').then(response => response.text()),
    fetch('表情字符对应.csv').then(response => response.text()),
    fetch('场景字符对应.csv').then(response => response.text())
])
.then(([nameData, expressionData, sceneData]) => {
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

    renderScript(); // 重新渲染脚本以更新角色名、表情和场景下拉框
})
.catch(error => {
    console.error('Error loading CSV files:', error);
    alert('无法加载CSV文件，请确保文件存在并且可以访问。');
});

function renderScript() {
    const scriptBody = document.getElementById('script-body');
    scriptBody.innerHTML = '';
    scriptData.forEach((row, index) => {
        const tr = document.createElement('tr');
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
            <td class="content">${stripTags(row.content)}</td>
            <td class="drag-handle">⋮⋮</td>
        `;
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
    const row = scriptData[selectedRow];
    const sceneText = row.transition ? `转${row.scene}` : row.scene;
    inputBox.value = `${row.character}(${row.expression})[${sceneText}]:${row.content}`;
    updatePreview();
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
    const tr = e.target.closest('tr');
    if (tr) {
        selectedRow = parseInt(tr.dataset.index);
        renderScript();
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
    const prevRow = scriptData[selectedRow];
    const newScene = prevRow?.scene || sceneList[0] || '默认场景';
    const newRow = { character: '动作', expression: '普通', scene: newScene, content: '新动作' };
    scriptData.splice(selectedRow + 1, 0, newRow);
    selectedRow++;
    renderScript();
    updateInputBox();
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
    const exportText = scriptData.map(row => {
        const characterChar = nameCharMap[row.character] || row.character;
        const expressionChar = expressionCharMap[row.character] && expressionCharMap[row.character][row.expression] 
            ? expressionCharMap[row.character][row.expression] 
            : row.expression;
        let sceneChar = sceneCharMap[row.scene] || row.scene;
        if (row.transition) {
            sceneChar = sceneChar.toLowerCase();
        }
        return `"${characterChar}${expressionChar}${sceneChar}:${row.content.replace(/\n/g, '\\n')}"`;
    }).join(',\n');
    navigator.clipboard.writeText(exportText);
});

document.getElementById('save').addEventListener('click', () => {
    const csvContent = scriptData.map(row => 
        `${row.character},${row.expression},${row.scene},${row.transition},${row.content.replace(/,/g, '&#44;').replace(/\n/g, '\\n')}`
    ).join('\n');
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
    input.accept = '.csv';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file,'UTF-8');
        reader.onload = readerEvent => {
            const content = readerEvent.target.result;
            scriptData = content.split('\n').map(line => {
                const [character, expression, scene, transition, ...contentParts] = line.split(',');
                const content = contentParts.join(',')
                    .replace(/&#44;/g, ',')
                    .replace(/\\n/g, '\n');
                return { character, expression, scene, transition: transition === 'true', content };
            });
            selectedRow = 0;
            renderScript();
        }
    }
    input.click();
});

// 初始化拖拽功能
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

// 键盘上下键选择行
document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName !== 'TEXTAREA') {
        if (e.key === 'ArrowUp' && selectedRow > 0) {
            selectedRow--;
            renderScript();
        } else if (e.key === 'ArrowDown' && selectedRow < scriptData.length - 1) {
            selectedRow++;
            renderScript();
        }
    }
});

renderScript();

// 在文件末尾添加以下内容

const shakeButton = document.getElementById('shake-button');
const shakeMenu = document.getElementById('shake-menu');

// 修改 shakeButton 的点击事件监听器
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
        // 没有选中文本,在��标处插入标签
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
    scriptData.forEach((row, index) => {
        if (rows[index]) {
            const characterSelect = rows[index].querySelector('.character select');
            const expressionSelect = rows[index].querySelector('.expression select');
            const sceneSelect = rows[index].querySelector('.scene select');
            const transitionCheckbox = rows[index].querySelector('.transition input');
            const contentCell = rows[index].querySelector('.content');
            
            if (characterSelect) {
                characterSelect.value = row.character;
                characterSelect.innerHTML = getCharacterOptions(row.character);
            }
            if (expressionSelect) {
                expressionSelect.innerHTML = getExpressionOptions(row.character, row.expression);
                expressionSelect.value = row.expression;
            }
            if (sceneSelect) {
                sceneSelect.value = row.scene;
            }
            if (transitionCheckbox) {
                transitionCheckbox.checked = row.transition;
            }
            if (contentCell) {
                contentCell.textContent = stripTags(row.content);
            }
        }
    });
}

// 添加新的函数来保持选择状态
function maintainSelection() {
    const inputBox = document.getElementById('input-box');
    const start = inputBox.selectionStart;
    const end = inputBox.selectionEnd;

    // 使用 setTimeout 来确保在失去焦点后仍能设置选择范围
    setTimeout(() => {
        inputBox.setSelectionRange(start, end);
    }, 0);
}

// 为输入框添加失去焦点事件监听器
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
            // 选中了文本,在选中文本的开头插入标签
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
            // 没有选中文本,在光标处插入标签
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
    const match = newText.match(/^(.+?)\((.+?)\)\[(.+?)\]:(.*)$/);
    if (match) {
        const [, character, expression, scene, content] = match;
        const isTransition = scene.startsWith('转');
        scriptData[selectedRow] = { 
            character: character.trim(), 
            expression: expression.trim(), 
            scene: isTransition ? scene.slice(1).trim() : scene.trim(),
            transition: isTransition,
            content: content.trim() 
        };
    } else {
        // 如果没有匹配到完整的格式，至少保存内容
        const colonIndex = newText.indexOf(':');
        if (colonIndex !== -1) {
            const character = newText.slice(0, colonIndex).trim();
            const content = newText.slice(colonIndex + 1).trim();
            scriptData[selectedRow] = { 
                ...scriptData[selectedRow], 
                character, 
                content 
            };
        }
    }
}

// 修改 input 事件监听器
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

