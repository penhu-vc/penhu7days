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

    function processCutout(inputFile, outputCutout, outputFinal, bgColor, isMan) {
        var doc = app.open(new File(projectPath + inputFile));

        // 轉為普通圖層（如果是背景圖層）
        try {
            if (doc.activeLayer.isBackgroundLayer) {
                doc.activeLayer.name = "Layer0";
            }
        } catch (e) {}

        if (!selectSubject()) {
            alert("Select Subject 失敗: " + inputFile);
            doc.close(SaveOptions.DONOTSAVECHANGES);
            return false;
        }

        // 複製選區
        try { doc.selection.copy(true); } catch (e) { doc.selection.copy(); }

        // 建立新文件（透明背景）用於儲存去背圖
        var cutDoc = app.documents.add(doc.width, doc.height, doc.resolution, "Cutout", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
        cutDoc.paste();

        // 儲存去背 PNG（保留透明）
        var cutFile = new File(projectPath + outputCutout);
        cutDoc.saveAs(cutFile, new PNGSaveOptions(), true);

        // 現在建立最終版（有背景）
        var heroDoc = app.documents.add(1920, 1080, 72, "Hero-Final", NewDocumentMode.RGB, DocumentFill.WHITE);
        app.activeDocument = heroDoc;

        // 填充背景色
        heroDoc.selection.selectAll();
        heroDoc.selection.fill(bgColor);
        heroDoc.selection.deselect();

        // 複製去背人物到最終文件
        app.activeDocument = cutDoc;
        cutDoc.activeLayer.duplicate(heroDoc, ElementPlacement.PLACEATBEGINNING);

        // 調整人物
        app.activeDocument = heroDoc;
        var pLayer = heroDoc.activeLayer;
        pLayer.name = "Person";

        var b = pLayer.bounds;
        var h = b[3].value - b[1].value;
        var targetH = isMan ? 1100 : 1050;
        var scale = (targetH / h) * 100;
        pLayer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

        var nb = pLayer.bounds;
        var nw = nb[2].value - nb[0].value;
        var nh = nb[3].value - nb[1].value;
        var offsetX = isMan ? 100 : 50;
        var offsetY = isMan ? 100 : 20;
        pLayer.translate(1920 - nw - offsetX - nb[0].value, 1080 - nh + offsetY - nb[1].value);

        // 合併並儲存最終版
        heroDoc.flatten();
        heroDoc.saveAs(new File(projectPath + outputFinal), new PNGSaveOptions(), true);

        // 關閉所有
        doc.close(SaveOptions.DONOTSAVECHANGES);
        cutDoc.close(SaveOptions.DONOTSAVECHANGES);
        heroDoc.close(SaveOptions.DONOTSAVECHANGES);

        return true;
    }

    // 女生 - 奶茶色背景
    var womanBg = new SolidColor();
    womanBg.rgb.red = 210;
    womanBg.rgb.green = 178;
    womanBg.rgb.blue = 148;

    // 男生 - 深色背景
    var manBg = new SolidColor();
    manBg.rgb.red = 20;
    manBg.rgb.green = 20;
    manBg.rgb.blue = 25;

    var ok1 = processCutout("hero-image.png", "hero-woman-cutout.png", "hero-woman-ps.png", womanBg, false);
    if (ok1) {
        var ok2 = processCutout("hero-image-2.png", "hero-man-cutout.png", "hero-man-ps.png", manBg, true);
        if (ok2) {
            alert("全部完成！\n\n去背圖：\n- hero-woman-cutout.png\n- hero-man-cutout.png\n\n最終版：\n- hero-woman-ps.png\n- hero-man-ps.png");
        }
    }
})();
