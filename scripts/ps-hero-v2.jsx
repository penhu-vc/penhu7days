/*------------------------------------------------------------------------------------
  Penhu 7Days Hero 圖片處理腳本
  使用 autoCutout 選取主體並建立延伸背景
--------------------------------------------------------------------------------------*/
#target photoshop

var projectPath = "/Users/yaja/projects/penhu7days/public/";

// ============ 處理女生圖片 ============
function processWoman() {
    // 開啟原圖
    var womanFile = new File(projectPath + "hero-image.png");
    var srcDoc = app.open(womanFile);

    // 轉換背景圖層為普通圖層
    try {
        srcDoc.backgroundLayer.name = "Original";
    } catch(e) {}

    // 使用 autoCutout 選取主體
    var idautoCutout = stringIDToTypeID("autoCutout");
    var desc01 = new ActionDescriptor();
    var idsampleAllLayers = stringIDToTypeID("sampleAllLayers");
    desc01.putBoolean(idsampleAllLayers, false);
    try {
        executeAction(idautoCutout, desc01, DialogModes.NO);
    } catch(err) {
        alert("autoCutout 失敗: " + err);
        return;
    }

    // 擴展選區讓邊緣更自然
    srcDoc.selection.expand(new UnitValue(2, "px"));
    srcDoc.selection.feather(new UnitValue(1, "px"));

    // 複製選區
    srcDoc.selection.copy();

    // 建立新文件 1920x1080
    var heroDoc = app.documents.add(1920, 1080, 72, "Hero-Woman-Final", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);

    // 建立漸變背景圖層
    var bgLayer = heroDoc.artLayers.add();
    bgLayer.name = "Background";

    heroDoc.selection.selectAll();

    // 設定奶茶色漸變
    var foreColor = new SolidColor();
    foreColor.rgb.red = 215;
    foreColor.rgb.green = 185;
    foreColor.rgb.blue = 155;
    app.foregroundColor = foreColor;

    var backColor = new SolidColor();
    backColor.rgb.red = 175;
    backColor.rgb.green = 150;
    backColor.rgb.blue = 125;
    app.backgroundColor = backColor;

    // 填充漸變 (由上到下)
    var idGrdn = charIDToTypeID("Grdn");
    var descGrad = new ActionDescriptor();
    var idFrom = charIDToTypeID("From");
    var descFrom = new ActionDescriptor();
    descFrom.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), 0);
    descFrom.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), 0);
    descGrad.putObject(idFrom, charIDToTypeID("Pnt "), descFrom);
    var idT = charIDToTypeID("T   ");
    var descTo = new ActionDescriptor();
    descTo.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), 0);
    descTo.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), 1080);
    descGrad.putObject(idT, charIDToTypeID("Pnt "), descTo);
    descGrad.putEnumerated(charIDToTypeID("Type"), charIDToTypeID("GrdT"), charIDToTypeID("Lnr "));
    executeAction(idGrdn, descGrad, DialogModes.NO);

    heroDoc.selection.deselect();

    // 加入光暈圖層
    var glowLayer = heroDoc.artLayers.add();
    glowLayer.name = "Glow";
    glowLayer.move(bgLayer, ElementPlacement.PLACEAFTER);

    var glowRegion = [
        [1000, 150],
        [1900, 150],
        [1900, 930],
        [1000, 930]
    ];
    heroDoc.selection.select(glowRegion);
    heroDoc.selection.feather(new UnitValue(200, "px"));

    var glowColor = new SolidColor();
    glowColor.rgb.red = 255;
    glowColor.rgb.green = 235;
    glowColor.rgb.blue = 210;
    heroDoc.selection.fill(glowColor);
    glowLayer.opacity = 45;

    heroDoc.selection.deselect();

    // 貼上人物
    heroDoc.paste();
    var personLayer = heroDoc.activeLayer;
    personLayer.name = "Person";

    // 調整人物大小 (高度約為畫布的 100%)
    var bounds = personLayer.bounds;
    var layerH = bounds[3].value - bounds[1].value;
    var targetH = 1080;
    var scale = (targetH / layerH) * 100;
    personLayer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

    // 移動到右側
    var newBounds = personLayer.bounds;
    var newW = newBounds[2].value - newBounds[0].value;
    var newH = newBounds[3].value - newBounds[1].value;
    var moveX = 1920 - newW - 20 - newBounds[0].value;
    var moveY = 1080 - newH + 20 - newBounds[1].value;
    personLayer.translate(moveX, moveY);

    // 儲存
    var saveFile = new File(projectPath + "hero-woman-ps.png");
    var pngOpts = new PNGSaveOptions();
    pngOpts.compression = 6;
    heroDoc.saveAs(saveFile, pngOpts, true);

    // 關閉文件
    srcDoc.close(SaveOptions.DONOTSAVECHANGES);
    heroDoc.close(SaveOptions.DONOTSAVECHANGES);

    return true;
}

// ============ 處理男生圖片 ============
function processMan() {
    // 開啟原圖
    var manFile = new File(projectPath + "hero-image-2.png");
    var srcDoc = app.open(manFile);

    // 轉換背景圖層
    try {
        srcDoc.backgroundLayer.name = "Original";
    } catch(e) {}

    // 使用 autoCutout 選取主體
    var idautoCutout = stringIDToTypeID("autoCutout");
    var desc01 = new ActionDescriptor();
    var idsampleAllLayers = stringIDToTypeID("sampleAllLayers");
    desc01.putBoolean(idsampleAllLayers, false);
    try {
        executeAction(idautoCutout, desc01, DialogModes.NO);
    } catch(err) {
        alert("autoCutout 男生失敗: " + err);
        return;
    }

    // 擴展選區
    srcDoc.selection.expand(new UnitValue(2, "px"));
    srcDoc.selection.feather(new UnitValue(1, "px"));

    // 複製
    srcDoc.selection.copy();

    // 建立新文件
    var heroDoc = app.documents.add(1920, 1080, 72, "Hero-Man-Final", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);

    // 深色背景
    var bgLayer = heroDoc.artLayers.add();
    bgLayer.name = "Background";

    heroDoc.selection.selectAll();

    var bgColor = new SolidColor();
    bgColor.rgb.red = 18;
    bgColor.rgb.green = 18;
    bgColor.rgb.blue = 22;
    heroDoc.selection.fill(bgColor);

    heroDoc.selection.deselect();

    // 橘色光暈
    var glowLayer = heroDoc.artLayers.add();
    glowLayer.name = "Orange Glow";
    glowLayer.move(bgLayer, ElementPlacement.PLACEAFTER);

    var glowRegion = [
        [900, 0],
        [1920, 0],
        [1920, 1080],
        [900, 1080]
    ];
    heroDoc.selection.select(glowRegion);
    heroDoc.selection.feather(new UnitValue(250, "px"));

    var orangeGlow = new SolidColor();
    orangeGlow.rgb.red = 241;
    orangeGlow.rgb.green = 132;
    orangeGlow.rgb.blue = 1;
    heroDoc.selection.fill(orangeGlow);
    glowLayer.opacity = 12;

    heroDoc.selection.deselect();

    // 貼上人物
    heroDoc.paste();
    var personLayer = heroDoc.activeLayer;
    personLayer.name = "Person";

    // 調整大小
    var bounds = personLayer.bounds;
    var layerH = bounds[3].value - bounds[1].value;
    var targetH = 1200; // 稍微超出畫布
    var scale = (targetH / layerH) * 100;
    personLayer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

    // 移動到右側
    var newBounds = personLayer.bounds;
    var newW = newBounds[2].value - newBounds[0].value;
    var newH = newBounds[3].value - newBounds[1].value;
    var moveX = 1920 - newW - 60 - newBounds[0].value;
    var moveY = 1080 - newH + 150 - newBounds[1].value;
    personLayer.translate(moveX, moveY);

    // 儲存
    var saveFile = new File(projectPath + "hero-man-ps.png");
    var pngOpts = new PNGSaveOptions();
    pngOpts.compression = 6;
    heroDoc.saveAs(saveFile, pngOpts, true);

    // 關閉
    srcDoc.close(SaveOptions.DONOTSAVECHANGES);
    heroDoc.close(SaveOptions.DONOTSAVECHANGES);

    return true;
}

// 執行
try {
    var womanOK = processWoman();
    if (womanOK) {
        var manOK = processMan();
        if (manOK) {
            alert("兩張圖片都處理完成！\n\n已儲存：\n- hero-woman-ps.png\n- hero-man-ps.png");
        }
    }
} catch(e) {
    alert("錯誤: " + e);
}
