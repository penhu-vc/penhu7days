// Photoshop ExtendScript - 處理 Hero 圖片
// 建立更炫酷的背景效果

#target photoshop

// 設定
var projectPath = "/Users/yaja/projects/penhu7days/public/";
var outputPath = "/Users/yaja/projects/penhu7days/public/";

// 建立新文件 - 網站 Hero 尺寸
var heroWidth = 1920;
var heroHeight = 1080;

// ============ 處理女生圖片 ============
function processWomanImage() {
    // 開啟原圖
    var womanFile = new File(projectPath + "hero-image.png");
    var womanDoc = app.open(womanFile);

    // 選取主體 (Select Subject)
    try {
        var idSelectSubject = stringIDToTypeID("selectSubject");
        var desc = new ActionDescriptor();
        desc.putInteger(stringIDToTypeID("sampleAllLayers"), 0);
        executeAction(idSelectSubject, desc, DialogModes.NO);
    } catch (e) {
        alert("Select Subject 失敗，請手動選取: " + e);
        return;
    }

    // 擴展選區 2px 讓邊緣更自然
    app.activeDocument.selection.expand(new UnitValue(2, "px"));

    // 羽化選區
    app.activeDocument.selection.feather(new UnitValue(1, "px"));

    // 複製選區到新圖層
    app.activeDocument.selection.copy();

    // 建立新文件 (較大尺寸，可以當全屏背景)
    var newDoc = app.documents.add(heroWidth, heroHeight, 72, "Hero-Woman-Extended", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);

    // 貼上人物
    newDoc.paste();
    var personLayer = newDoc.activeLayer;
    personLayer.name = "Person";

    // 調整人物大小和位置 (放在右側)
    var bounds = personLayer.bounds;
    var layerWidth = bounds[2] - bounds[0];
    var layerHeight = bounds[3] - bounds[1];

    // 縮放讓人物高度約為畫布高度的 95%
    var targetHeight = heroHeight * 0.95;
    var scale = (targetHeight / layerHeight) * 100;
    personLayer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

    // 移動到右側
    var newBounds = personLayer.bounds;
    var newWidth = newBounds[2] - newBounds[0];
    var newHeight = newBounds[3] - newBounds[1];
    var moveX = heroWidth - newWidth - 100; // 距離右邊 100px
    var moveY = (heroHeight - newHeight) / 2; // 垂直置中
    personLayer.translate(moveX - newBounds[0], moveY - newBounds[1]);

    // 建立漸變背景圖層
    var bgLayer = newDoc.artLayers.add();
    bgLayer.name = "Gradient Background";
    bgLayer.move(personLayer, ElementPlacement.PLACEAFTER);

    // 選取整個畫布
    newDoc.selection.selectAll();

    // 設定前景色和背景色 (奶茶色漸變)
    var foreColor = new SolidColor();
    foreColor.rgb.red = 210;
    foreColor.rgb.green = 175;
    foreColor.rgb.blue = 140;
    app.foregroundColor = foreColor;

    var backColor = new SolidColor();
    backColor.rgb.red = 170;
    backColor.rgb.green = 140;
    backColor.rgb.blue = 110;
    app.backgroundColor = backColor;

    // 用漸層填充
    var gradientFill = new ActionDescriptor();
    var gradientDesc = new ActionDescriptor();
    var colorStops = new ActionList();

    // 簡單填充前景色先
    newDoc.selection.fill(foreColor);

    // 取消選取
    newDoc.selection.deselect();

    // 加入輕微的光暈效果在人物後面
    var glowLayer = newDoc.artLayers.add();
    glowLayer.name = "Glow";
    glowLayer.move(personLayer, ElementPlacement.PLACEAFTER);

    // 選取橢圓區域
    var glowRegion = [
        [heroWidth * 0.4, heroHeight * 0.2],
        [heroWidth * 0.95, heroHeight * 0.2],
        [heroWidth * 0.95, heroHeight * 0.8],
        [heroWidth * 0.4, heroHeight * 0.8]
    ];
    newDoc.selection.select(glowRegion);
    newDoc.selection.feather(new UnitValue(150, "px"));

    // 淺色填充
    var glowColor = new SolidColor();
    glowColor.rgb.red = 240;
    glowColor.rgb.green = 210;
    glowColor.rgb.blue = 180;
    newDoc.selection.fill(glowColor);
    glowLayer.opacity = 60;

    newDoc.selection.deselect();

    // 合併並儲存
    newDoc.flatten();
    var saveFile = new File(outputPath + "hero-woman-extended.png");
    var pngOptions = new PNGSaveOptions();
    pngOptions.compression = 6;
    newDoc.saveAs(saveFile, pngOptions, true);

    // 關閉文件
    womanDoc.close(SaveOptions.DONOTSAVECHANGES);
    newDoc.close(SaveOptions.DONOTSAVECHANGES);

    alert("女生圖片處理完成！\n儲存至: " + saveFile.fsName);
}

// ============ 處理男生圖片 ============
function processManImage() {
    // 開啟原圖
    var manFile = new File(projectPath + "hero-image-2.png");
    var manDoc = app.open(manFile);

    // 選取主體
    try {
        var idSelectSubject = stringIDToTypeID("selectSubject");
        var desc = new ActionDescriptor();
        desc.putInteger(stringIDToTypeID("sampleAllLayers"), 0);
        executeAction(idSelectSubject, desc, DialogModes.NO);
    } catch (e) {
        alert("Select Subject 失敗: " + e);
        return;
    }

    // 擴展和羽化選區
    app.activeDocument.selection.expand(new UnitValue(2, "px"));
    app.activeDocument.selection.feather(new UnitValue(1, "px"));

    // 複製
    app.activeDocument.selection.copy();

    // 建立新文件
    var newDoc = app.documents.add(heroWidth, heroHeight, 72, "Hero-Man-Extended", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);

    // 貼上人物
    newDoc.paste();
    var personLayer = newDoc.activeLayer;
    personLayer.name = "Person";

    // 調整大小
    var bounds = personLayer.bounds;
    var layerHeight = bounds[3] - bounds[1];
    var targetHeight = heroHeight * 0.9;
    var scale = (targetHeight / layerHeight) * 100;
    personLayer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

    // 移動到右側
    var newBounds = personLayer.bounds;
    var newWidth = newBounds[2] - newBounds[0];
    var newHeight = newBounds[3] - newBounds[1];
    var moveX = heroWidth - newWidth - 150;
    var moveY = (heroHeight - newHeight) / 2 + 50; // 稍微往下
    personLayer.translate(moveX - newBounds[0], moveY - newBounds[1]);

    // 建立深色背景
    var bgLayer = newDoc.artLayers.add();
    bgLayer.name = "Dark Background";
    bgLayer.move(personLayer, ElementPlacement.PLACEAFTER);

    newDoc.selection.selectAll();

    // 深灰色背景
    var bgColor = new SolidColor();
    bgColor.rgb.red = 25;
    bgColor.rgb.green = 25;
    bgColor.rgb.blue = 28;
    newDoc.selection.fill(bgColor);

    newDoc.selection.deselect();

    // 加入橘色光暈
    var glowLayer = newDoc.artLayers.add();
    glowLayer.name = "Orange Glow";
    glowLayer.move(personLayer, ElementPlacement.PLACEAFTER);

    var glowRegion = [
        [heroWidth * 0.5, 0],
        [heroWidth, 0],
        [heroWidth, heroHeight],
        [heroWidth * 0.5, heroHeight]
    ];
    newDoc.selection.select(glowRegion);
    newDoc.selection.feather(new UnitValue(200, "px"));

    var orangeGlow = new SolidColor();
    orangeGlow.rgb.red = 241;
    orangeGlow.rgb.green = 132;
    orangeGlow.rgb.blue = 1;
    newDoc.selection.fill(orangeGlow);
    glowLayer.opacity = 15;

    newDoc.selection.deselect();

    // 合併並儲存
    newDoc.flatten();
    var saveFile = new File(outputPath + "hero-man-extended.png");
    var pngOptions = new PNGSaveOptions();
    pngOptions.compression = 6;
    newDoc.saveAs(saveFile, pngOptions, true);

    manDoc.close(SaveOptions.DONOTSAVECHANGES);
    newDoc.close(SaveOptions.DONOTSAVECHANGES);

    alert("男生圖片處理完成！\n儲存至: " + saveFile.fsName);
}

// 執行
try {
    processWomanImage();
    processManImage();
    alert("全部處理完成！");
} catch (e) {
    alert("錯誤: " + e);
}
