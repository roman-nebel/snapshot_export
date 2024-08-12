const frames = figma.currentPage.selection as FrameNode[];

const variants: any = [];

function getReactions(nodes: FrameNode[]) {
  for (const node of nodes) {
    for (const reaction of node.reactions) {
      variants.push({
        targetFrame: node.id,
        action: reaction.action,
      });
    }

    if (node.children) {
      getReactionsRecursive(node.children as FrameNode[], node);
    }
  }
}

function getReactionsRecursive(nodes: FrameNode[], baseNode: FrameNode) {
  for (const node of nodes) {
    for (const reaction of node.reactions) {
      if (
        reaction.action?.type === "NODE" &&
        reaction.action?.navigation === "OVERLAY"
      )
        variants.push({
          targetFrame: baseNode.id,
          action: reaction.action,
        });
    }

    if (node.children) {
      getReactionsRecursive(node.children as FrameNode[], baseNode);
    }
  }
}

getReactions(frames);

console.log(variants);

figma.closePlugin();
