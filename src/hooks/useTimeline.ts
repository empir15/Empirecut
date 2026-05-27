/**
 * EmpireCut — useTimeline Hook
 *
 * Interface entre le composant Timeline et le TimelineEngine.
 * Gère layout, zoom, scroll, sélection de clip.
 */
import { useState, useCallback, useMemo } from 'react';
import { timelineEngine } from '../timeline/timeline.engine';
import { useEditorStore } from '../store/editor.store';
import type { TimelineLayout } from '../timeline/timeline.engine';

export const useTimeline = () => {
  const { clips, currentTimeMs, setCurrentTime, setSelectedClip, selectedClipId } =
    useEditorStore();
  const [zoom, setZoomState] = useState(timelineEngine.getZoom());

  // Recalcul du layout quand les clips ou le zoom changent
  const layout: TimelineLayout = useMemo(
    () => timelineEngine.computeLayout(clips),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clips, zoom],
  );

  const handleZoomIn = useCallback(() => {
    const newZoom = timelineEngine.zoom(10);
    setZoomState(newZoom);
  }, []);

  const handleZoomOut = useCallback(() => {
    const newZoom = timelineEngine.zoom(-10);
    setZoomState(newZoom);
  }, []);

  const handleResetZoom = useCallback(() => {
    timelineEngine.resetZoom();
    setZoomState(timelineEngine.getZoom());
  }, []);

  const handleSeek = useCallback(
    (pixelX: number) => {
      const timeSec = timelineEngine.pixelToTime(pixelX);
      setCurrentTime(timeSec * 1000); // convertir en ms
    },
    [setCurrentTime],
  );

  const handleSelectClip = useCallback(
    (pixelX: number) => {
      const clipId = timelineEngine.findClipAtPixel(pixelX, clips);
      setSelectedClip(clipId);
    },
    [clips, setSelectedClip],
  );

  const playheadX = useMemo(
    () => timelineEngine.getPlayheadPosition(currentTimeMs / 1000),
    [currentTimeMs],
  );

  return {
    layout,
    zoom,
    playheadX,
    selectedClipId,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleSeek,
    handleSelectClip,
  };
};
