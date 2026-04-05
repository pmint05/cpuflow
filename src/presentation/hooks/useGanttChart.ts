import { useRef, useEffect, useCallback } from 'react';
import { GanttChartRenderer } from '@infra/canvas/gantt-renderer';
import type {
  GanttBlock,
  ProcessAnnotationMode,
  TimeLabelRenderMode,
} from '@domain/types/cpu-scheduling';

/**
 * Hook for managing Gantt chart canvas
 */
export function useGanttChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GanttChartRenderer | null>(null);
  const lastRenderRef = useRef<{
    blocks: GanttBlock[];
    colorful: boolean;
    darkMode: boolean;
    processAnnotationMode: ProcessAnnotationMode;
    timeLabelRenderMode: TimeLabelRenderMode;
    allowProcessNameInBlock: boolean;
    showQueueAnnotation: boolean;
  } | null>(null);

  /**
   * Initialize renderer
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize renderer with default width
    rendererRef.current = new GanttChartRenderer(canvasRef.current, {
      width: canvasRef.current.parentElement?.clientWidth || 800,
      blockHeight: 50,
      lineSpacing: 40,
      fontSize: 24,
      fontFamily: 'Inter, system-ui, sans-serif',
      showTimeLabels: true,
      showProcessNames: true,
      allowProcessNameInBlock: true,
      borderWidth: 2,
      borderColor: '#000000',
      colorful: true,
    });

    // Handle resize
    const handleResize = () => {
      if (canvasRef.current && rendererRef.current) {
        const newWidth = canvasRef.current.parentElement?.clientWidth || 800;
        rendererRef.current.updateConfig({ width: newWidth });

        // Re-render with latest data so preview always fits resized container.
        if (lastRenderRef.current) {
          const {
            blocks,
            colorful,
            darkMode,
            processAnnotationMode,
            timeLabelRenderMode,
            allowProcessNameInBlock,
            showQueueAnnotation,
          } = lastRenderRef.current;

          rendererRef.current.updateConfig({ allowProcessNameInBlock });
          rendererRef.current.render(blocks, {
            colorful,
            darkMode,
            processAnnotationMode,
            timeLabelRenderMode,
            showQueueAnnotation,
          });
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  /**
   * Render Gantt chart
   */
  const render = useCallback(
    (
      blocks: GanttBlock[],
      colorful: boolean = true,
      darkMode: boolean = false,
      processAnnotationMode: ProcessAnnotationMode = 'POINTER_LEVELING',
      timeLabelRenderMode: TimeLabelRenderMode = 'LINE_LEVELING',
      allowProcessNameInBlock: boolean = true,
      showQueueAnnotation: boolean = false
    ) => {
      if (!rendererRef.current || !canvasRef.current) return;

      lastRenderRef.current = {
        blocks,
        colorful,
        darkMode,
        processAnnotationMode,
        timeLabelRenderMode,
        allowProcessNameInBlock,
        showQueueAnnotation,
      };

      // Update width based on container
      const containerWidth = canvasRef.current.parentElement?.clientWidth || 800;
      rendererRef.current.updateConfig({ width: containerWidth, allowProcessNameInBlock });

      // Render with selected chart annotation and time label strategies
      rendererRef.current.render(blocks, {
        colorful,
        darkMode,
        processAnnotationMode,
        timeLabelRenderMode,
        showQueueAnnotation,
      });
    },
    []
  );

  /**
   * Export to PNG in Full HD resolution
   */
  const exportToPNG = useCallback((filename?: string) => {
    if (!rendererRef.current) {
      console.warn('Renderer not initialized');
      return;
    }

    // Get Full HD data URL from renderer
    const dataUrl = rendererRef.current.exportToPNG();

    // Create download link
    const link = document.createElement('a');
    link.download = filename || `gantt-chart-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  return {
    canvasRef,
    render,
    exportToPNG,
  };
}
