const frames = figma.currentPage.selection as FrameNode[];

type VariantType = {
  triggerNodeId: string;
  action: Action;
};

type VariantsType = {
  [key: string]: VariantType[];
};

const variants: VariantsType = {};

function addItem(key: string, item: VariantType) {
  if (!variants[key]) {
    variants[key] = [];
  }
  variants[key].push(item);
}

function getReactionsRecursive(nodes: FrameNode[], baseNodeId: string) {
  for (const node of nodes) {
    for (const reaction of node.reactions) {
      if (
        reaction.action &&
        reaction.action?.type === "NODE" &&
        reaction.action?.navigation === "OVERLAY"
      )
        addItem(baseNodeId, {
          triggerNodeId: node.id,
          action: reaction.action,
        });
    }

    if (node.children) {
      getReactionsRecursive(node.children as FrameNode[], baseNodeId);
    }
  }
}

async function getReactions(nodes: FrameNode[]) {
  for (const node of nodes) {
    for (const reaction of node.reactions) {
      if (reaction.action) {
        addItem(node.id, {
          triggerNodeId: node.id,
          action: reaction.action,
        });
      }
    }

    if (node.children) {
      getReactionsRecursive(node.children as FrameNode[], node.id);
    }

    for (const { triggerNodeId, action } of variants[node.id]) {
      const triggeredNode = (await figma.getNodeByIdAsync(
        triggerNodeId
      )) as SceneNode;
      const addingNode = (await figma.getNodeByIdAsync(
        action.destinationId || ""
      )) as SceneNode;
      if (addingNode) {
        const nodeAbsoluteX = node.absoluteBoundingBox?.x || 0;
        const nodeAbsoluteY = node.absoluteBoundingBox?.y || 0;
        const overlayAbsoluteX = triggeredNode.absoluteBoundingBox?.x || 0;
        const overlayAbsoluteY = triggeredNode.absoluteBoundingBox?.y || 0;
        const newAddingNode = addingNode.clone() as FrameNode;
        node.appendChild(newAddingNode);
        if (node.layoutMode !== "NONE")
          newAddingNode.layoutPositioning = "ABSOLUTE";
        newAddingNode.x =
          overlayAbsoluteX -
            nodeAbsoluteX +
            action.overlayRelativePosition?.x || 0;
        newAddingNode.y =
          overlayAbsoluteY -
            nodeAbsoluteY +
            action.overlayRelativePosition?.y || 0;
        const imageRaw = await node.exportAsync({ format: "PNG" });
        const image = figma.createImage(imageRaw);

        const width = node.width;
        const height = node.height;

        const rect = figma.createRectangle();
        rect.resize(width, height);

        const fill: Paint = {
          type: "IMAGE",
          scaleMode: "FIT",
          imageHash: image.hash,
        };

        rect.fills = [fill];

        figma.currentPage.appendChild(rect);
        newAddingNode.remove();
      }
    }
  }
  figma.closePlugin();
}

getReactions(frames);
