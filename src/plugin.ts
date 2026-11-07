penpot.ui.open("Penpot plugin starter template", `?theme=${penpot.theme}`);

penpot.ui.onMessage<string>((message) => {
  if (message === "create-text") {
    const text = penpot.createText("Hello world!");

    if (text) {
      text.x = penpot.viewport.center.x;
      text.y = penpot.viewport.center.y;

      penpot.selection = [text];
    }
  }
});

// Update the theme in the iframe
penpot.on("themechange", (theme) => {
  penpot.ui.sendMessage({
    source: "penpot",
    type: "themechange",
    theme,
  });
});

function addRect(message: SvgMessage) {
  const shape = penpot.createShapeFromSvg(message.content);

  if (shape) {
    shape.name = message.name
    shape.proportionLock = true
    shape.constraintsHorizontal = 'scale'
    shape.constraintsVertical = 'scale'
    shape.x = penpot.viewport.center.x
    shape.y = penpot.viewport.center.y
    penpot.selection = [shape]
  }
}