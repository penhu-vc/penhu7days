/*
  Penhu Hero 摳圖腳本
  1. selectSubject 或 autoCutout 選取主體
  2. 複製選取區
  3. 貼上成新圖層
*/
#target photoshop

var projectPath = "/Users/yaja/projects/penhu7days/public/";

// 選取主體函數
function selectSubjectAuto() {
    // 先試 selectSubject
    try {
        var desc = new ActionDescriptor();
        desc.putInteger(stringIDToTypeID("sampleAllLayers"), 0);
        executeAction(stringIDToTypeID("selectSubject"), desc, DialogModes.NO);
        return true;
    } catch(e1) {
        // 再試 autoCutout
        try {
            var desc2 = new ActionDescriptor();
            desc2.putBoolean(stringIDToTypeID("sampleAllLayers"), false);
            executeAction(stringIDToTypeID("autoCutout"), desc2, DialogModes.NO);
            return true;
        } catch(e2) {
            alert("selectSubject 和 autoCutout 都失敗了:\n" + e1 + "\n" + e2);
            return false;
        }
    }
}

// ========== 處理女生 ==========
function processWoman() {
    var srcFile = new File(projectPath + "hero-image.png");
    var srcDoc = app.open(srcFile);

    // 轉為普通圖層
    try { srcDoc.backgroundLayer.name = "Original"; } catch(e) {}

    // 選取主體
    if (!selectSubjectAuto()) return false;

    // 複製選取區 (Cmd+C)
    srcDoc.selection.copy();

    // 貼上成新圖層 (Cmd+V) - 這會自動建立新圖層
    srcDoc.paste();

    // 現在 activeLayer 就是摳出的人物
    var personLayer = srcDoc.activeLayer;
    personLayer.name = "Person_Cutout";

    // 隱藏原圖層
    srcDoc.layers.getByName("Original").visible = false;

    // ===== 建立新畫布 =====
    var heroDoc = app.documents.add(1920, 1080, 72, "Hero-Woman", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);

    // 建立漸變背景
    var bgLayer = heroDoc.artLayers.add();
    bgLayer.name = "BG";
    heroDoc.selection.selectAll();

    // 奶茶色
    var c1 = new SolidColor(); c1.rgb.red = 210; c1.rgb.green = 178; c1.rgb.blue = 148;
    var c2 = new SolidColor(); c2.rgb.red = 168; c2.rgb.green = 143; c2.rgb.blue = 118;
    app.foregroundColor = c1;
    app.backgroundColor = c2;

    // 線性漸變
    var idGrdn = charIDToTypeID("Grdn");
    var desc = new ActionDescriptor();
    var descFrom = new ActionDescriptor();
    descFrom.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), 0);
    descFrom.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), 0);
    desc.putObject(charIDToTypeID("From"), charIDToTypeID("Pnt "), descFrom);
    var descTo = new ActionDescriptor();
    descTo.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), 0);
    descTo.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), 1080);
    desc.putObject(charIDToTypeID("T   "), charIDToTypeID("Pnt "), descTo);
    desc.putEnumerated(charIDToTypeID("Type"), charIDToTypeID("GrdT"), charIDToTypeID("Lnr "));
    executeAction(idGrdn, desc, DialogModes.NO);
    heroDoc.selection.deselect();

    // 光暈
    var glowLayer = heroDoc.artLayers.add();
    glowLayer.name = "Glow";
    var region = [[1000,100],[1900,100],[1900,980],[1000,980]];
    heroDoc.selection.select(region);
    heroDoc.selection.feather(new UnitValue(180, "px"));
    var glowC = new SolidColor(); glowC.rgb.red = 255; glowC.rgb.green = 232; glowC.rgb.blue = 205;
    heroDoc.selection.fill(glowC);
    glowLayer.opacity = 50;
    heroDoc.selection.deselect();

    // 複製人物到新畫布
    app.activeDocument = srcDoc;
    personLayer.duplicate(heroDoc, ElementPlacement.PLACEATBEGINNING);

    // 調整人物
    app.activeDocument = heroDoc;
    var pLayer = heroDoc.activeLayer;

    // 縮放
    var b = pLayer.bounds;
    var h = b[3].value - b[1].value;
    var scale = (1060 / h) * 100;
    pLayer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

    // 移到右側
    var nb = pLayer.bounds;
    var nw = nb[2].value - nb[0].value;
    var nh = nb[3].value - nb[1].value;
    pLayer.translate(1920 - nw - 30 - nb[0].value, 1080 - nh + 10 - nb[1].value);

    // 儲存
    var saveFile = new File(projectPath + "hero-woman-ps.png");
    heroDoc.saveAs(saveFile, new PNGSaveOptions(), true);

    srcDoc.close(SaveOptions.DONOTSAVECHANGES);
    heroDoc.close(SaveOptions.DONOTSAVECHANGES);

    return true;
}

// ========== 處理男生 ==========
function processMan() {
    var srcFile = new File(projectPath + "hero-image-2.png");
    var srcDoc = app.open(srcFile);

    try { srcDoc.backgroundLayer.name = "Original"; } catch(e) {}

    if (!selectSubjectAuto()) return false;

    srcDoc.selection.copy();
    srcDoc.paste();

    var personLayer = srcDoc.activeLayer;
    personLayer.name = "Person_Cutout";
    srcDoc.layers.getByName("Original").visible = false;

    // 新畫布
    var heroDoc = app.documents.add(1920, 1080, 72, "Hero-Man", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);

    // 深色背景
    var bgLayer = heroDoc.artLayers.add();
    bgLayer.name = "BG";
    heroDoc.selection.selectAll();
    var darkC = new SolidColor(); darkC.rgb.red = 18; darkC.rgb.green = 18; darkC.rgb.blue = 22;
    heroDoc.selection.fill(darkC);
    heroDoc.selection.deselect();

    // 橘色光暈
    var glowLayer = heroDoc.artLayers.add();
    glowLayer.name = "Glow";
    var region = [[850,0],[1920,0],[1920,1080],[850,1080]];
    heroDoc.selection.select(region);
    heroDoc.selection.feather(new UnitValue(220, "px"));
    var orangeC = new SolidColor(); orangeC.rgb.red = 241; orangeC.rgb.green = 132; orangeC.rgb.blue = 1;
    heroDoc.selection.fill(orangeC);
    glowLayer.opacity = 15;
    heroDoc.selection.deselect();

    // 複製人物
    app.activeDocument = srcDoc;
    personLayer.duplicate(heroDoc, ElementPlacement.PLACEATBEGINNING);

    app.activeDocument = heroDoc;
    var pLayer = heroDoc.activeLayer;

    var b = pLayer.bounds;
    var h = b[3].value - b[1].value;
    var scale = (1150 / h) * 100;
    pLayer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

    var nb = pLayer.bounds;
    var nw = nb[2].value - nb[0].value;
    var nh = nb[3].value - nb[1].value;
    pLayer.translate(1920 - nw - 80 - nb[0].value, 1080 - nh + 120 - nb[1].value);

    var saveFile = new File(projectPath + "hero-man-ps.png");
    heroDoc.saveAs(saveFile, new PNGSaveOptions(), true);

    srcDoc.close(SaveOptions.DONOTSAVECHANGES);
    heroDoc.close(SaveOptions.DONOTSAVECHANGES);

    return true;
}

// 執行
var ok1 = processWoman();
if (ok1) {
    var ok2 = processMan();
    if (ok2) {
        alert("完成！已儲存:\n- hero-woman-ps.png\n- hero-man-ps.png");
    }
}
