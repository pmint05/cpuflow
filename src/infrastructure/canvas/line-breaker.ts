import type { GanttBlock, GanttLine } from '@domain/types/cpu-scheduling';

interface LineBreakResult {
  lines: GanttLine[];
  totalHeight: number;
}

/**
 * Break Gantt chart blocks into multiple lines to fit A4 width
 * Critical feature: Splits blocks that exceed line width
 *
 * @param blocks - Gantt blocks to render
 * @param canvasWidth - Total canvas width (default: 793.7px for A4)
 * @param paddingX - Horizontal padding for time labels
 * @param timeScale - Pixels per time unit
 * @param blockHeight - Height of each block
 * @param lineSpacing - Vertical spacing between lines
 * @returns Line break result with lines and total height
 */
export function breakGanttIntoLines(
  blocks: GanttBlock[],
  canvasWidth: number = 793.7, // A4 width @ 96 DPI
  paddingX: number = 40, // Left/right padding for time labels
  timeScale: number = 10, // Pixels per time unit
  blockHeight: number = 40,
  lineSpacing: number = 30
): LineBreakResult {
  if (blocks.length === 0) {
    return { lines: [], totalHeight: 0 };
  }

  const availableWidth = canvasWidth - paddingX * 2;
  const lines: GanttLine[] = [];

  let currentLine: GanttBlock[] = [];
  let currentLineStartTime = blocks[0].startTime;
  let currentLineWidth = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockWidth = block.duration * timeScale;

    // Check if this block fits on current line
    if (currentLineWidth + blockWidth <= availableWidth) {
      // Fits completely on current line
      currentLine.push(block);
      currentLineWidth += blockWidth;
    } else {
      // Doesn't fit - need to split or start new line
      const remainingWidth = availableWidth - currentLineWidth;

      if (remainingWidth > timeScale) {
        // Enough space to split the block
        const firstPartDuration = remainingWidth / timeScale;
        const secondPartDuration = block.duration - firstPartDuration;

        // First part goes on current line
        const firstPart: GanttBlock = {
          ...block,
          endTime: block.startTime + firstPartDuration,
          duration: firstPartDuration,
          isContinuation: false, // Has left border
        };
        currentLine.push(firstPart);

        // Save current line
        const lineEndTime = firstPart.endTime;
        lines.push({
          blocks: currentLine,
          startTime: currentLineStartTime,
          endTime: lineEndTime,
          width: availableWidth,
        });

        // Second part starts new line (NO left border)
        const secondPart: GanttBlock = {
          ...block,
          startTime: block.startTime + firstPartDuration,
          duration: secondPartDuration,
          isContinuation: true, // No left border for visual continuity
        };

        currentLine = [secondPart];
        currentLineStartTime = secondPart.startTime;
        currentLineWidth = secondPartDuration * timeScale;
      } else {
        // Not enough space to split, start new line with full block
        if (currentLine.length > 0) {
          const lineEndTime = currentLine[currentLine.length - 1].endTime;
          lines.push({
            blocks: currentLine,
            startTime: currentLineStartTime,
            endTime: lineEndTime,
            width: currentLineWidth,
          });
        }

        currentLine = [block];
        currentLineStartTime = block.startTime;
        currentLineWidth = blockWidth;
      }
    }
  }

  // Add the last line
  if (currentLine.length > 0) {
    const lineEndTime = currentLine[currentLine.length - 1].endTime;
    lines.push({
      blocks: currentLine,
      startTime: currentLineStartTime,
      endTime: lineEndTime,
      width: currentLineWidth,
    });
  }

  // Calculate total height
  const totalHeight = lines.length * (blockHeight + lineSpacing);

  return { lines, totalHeight };
}
