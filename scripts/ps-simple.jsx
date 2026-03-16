#target photoshop

(function () {
    var projectPath = "/Users/yaja/projects/penhu7days/public/";

    function selectSubject() {
        try {
            executeAction(stringIDToTypeID("selectSubject"), new ActionDescriptor(), DialogModes.NO);
            return true;
        } catch (e) {}
        try {
            executeAction(stringIDToTypeID("autoCutout"), new ActionDescriptor(), DialogModes.NO);
            return true;
        } catch (e) {}
        return false;
    }

    // 開啟女生圖片
    var srcFile = new File(projectPath + "hero-image.png");
    var doc = app.open(srcFile);

    // 轉為普通圖層
    try { doc.backgroundLayer.name = "Original"; } catch (e) {}

    // 選取主體
    if (!selectSubject()) {
        alert("Select Subject 失敗");
        return;
    }

    // 複製並貼上
    try { doc.selection.copy(true); } catch (e) { doc.selection.copy(); }
    var cutLayer = doc.paste();
    cutLayer.name = "SUBJECT_CUT";

    // 隱藏原圖層
    doc.layers.getByName("Original").visible = false;

    // 建立新畫布
    var heroDoc = app.documents.add(1920, 1080, 72, "Hero-Woman", NewDocumentMode.RGB, DocumentFill.WHITE);

    // 切到新畫布，填充漸變背景
    app.activeDocument = heroDoc;
    var bgLayer = heroDoc.activeLayer;
    bgLayer.name = "BG";

    // 設定漸變色
    var c1 = new SolidColor();
    c1.rgb.red = 210; c1.rgb.green = 178; c1.rgb.blue = 148;
    var c2 = new SolidColor();
    c2.rgb.red = 168; c2.rgb.green = 143; c2.rgb.blue = 118;
    app.foregroundColor = c1;
    app.backgroundColor = c2;

    // 選全部
    heroDoc.selection.selectAll();

    // 用漸變工具填充 - 簡單方式：直接填前景色
    heroDoc.selection.fill(c1);
    heroDoc.selection.deselect();

    // 複製人物過來
    app.activeDocument = doc;
    cutLayer.duplicate(heroDoc, ElementPlacement.PLACEATBEGINNING);

    // 調整人物
    app.activeDocument = heroDoc;
    var pLayer = heroDoc.activeLayer;
    pLayer.name = "Person";

    // 縮放到合適大小
    var b = pLayer.bounds;
    var h = b[3].value - b[1].value;
    var scale = (1050 / h) * 100;
    pLayer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

    // 移到右側
    var nb = pLayer.bounds;
    var nw = nb[2].value - nb[0].value;
    var nh = nb[3].value - nb[1].value;
    var moveX = 1920 - nw - 50 - nb[0].value;
    var moveY = 1080 - nh + 20 - nb[1].value;
    pLayer.translate(moveX, moveY);

    // 合併並儲存
    heroDoc.flatten();
    var saveFile = new File(projectPath + "hero-woman-ps.png");
    var pngOpt = new PNGSaveOptions();
    heroDoc.saveAs(saveFile, pngOpt, true);

    // 關閉
    doc.close(SaveOptions.DONOTSAVECHANGES);
    heroDoc.close(SaveOptions.DONOTSAVECHANGES);

    alert("女生圖片完成！\n" + saveFile.fsName);
})();
