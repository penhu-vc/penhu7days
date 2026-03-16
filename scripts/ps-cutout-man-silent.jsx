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

    var doc = app.open(new File(projectPath + "hero-image-2.png"));
    try {
        if (doc.activeLayer.isBackgroundLayer) {
            doc.activeLayer.name = "Layer0";
        }
    } catch (e) {}

    if (!selectSubject()) {
        doc.close(SaveOptions.DONOTSAVECHANGES);
        return;
    }

    try { doc.selection.copy(true); } catch (e) { doc.selection.copy(); }

    var cutDoc = app.documents.add(doc.width, doc.height, doc.resolution, "Cutout", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
    cutDoc.paste();
    cutDoc.saveAs(new File(projectPath + "hero-man-cutout.png"), new PNGSaveOptions(), true);

    doc.close(SaveOptions.DONOTSAVECHANGES);
    cutDoc.close(SaveOptions.DONOTSAVECHANGES);
})();
