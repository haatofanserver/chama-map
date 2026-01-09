/**
 * Temporary click position storage for handling rapid clicks and state management
 */
export interface ClickPositionState {
  position: [number, number];
  prefecture: string;
  timestamp: number;
  isNearBoundary: boolean;
  confidence: number;
}

/**
 * Manages temporary click position storage for prefecture interactions
 * Handles rapid clicks, boundary detection, and automatic cleanup
 */
export class ClickPositionManager {
  private static instance: ClickPositionManager;
  private clickHistory: ClickPositionState[] = [];
  private readonly MAX_HISTORY_SIZE = 10;
  private readonly CLICK_TIMEOUT_MS = 5000; // 5 seconds

  static getInstance(): ClickPositionManager {
    if (!ClickPositionManager.instance) {
      ClickPositionManager.instance = new ClickPositionManager();
    }
    return ClickPositionManager.instance;
  }

  /**
   * Stores a click position with metadata
   */
  storeClickPosition(
    position: [number, number],
    prefecture: string,
    isNearBoundary: boolean = false,
    confidence: number = 1.0
  ): void {
    const clickState: ClickPositionState = {
      position,
      prefecture,
      timestamp: Date.now(),
      isNearBoundary,
      confidence
    };

    this.clickHistory.unshift(clickState);

    // Maintain history size
    if (this.clickHistory.length > this.MAX_HISTORY_SIZE) {
      this.clickHistory = this.clickHistory.slice(0, this.MAX_HISTORY_SIZE);
    }

    // Clean up old entries
    this.cleanupOldEntries();

    console.log('Stored click position:', clickState);
  }

  /**
   * Gets the most recent click position for a prefecture
   */
  getRecentClickPosition(prefecture: string): ClickPositionState | null {
    this.cleanupOldEntries();

    const recentClick = this.clickHistory.find(
      click => click.prefecture === prefecture
    );

    return recentClick || null;
  }

  /**
   * Handles multiple rapid clicks by returning the most confident position
   */
  handleRapidClicks(
    newPosition: [number, number],
    prefecture: string,
    isNearBoundary: boolean,
    confidence: number
  ): ClickPositionState {
    const recentClicks = this.clickHistory.filter(
      click => click.prefecture === prefecture &&
        (Date.now() - click.timestamp) < 1000 // Within 1 second
    );

    if (recentClicks.length > 0) {
      // Find the click with highest confidence
      const bestClick = recentClicks.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );

      // If new click has higher confidence, use it
      if (confidence > bestClick.confidence) {
        const newClickState: ClickPositionState = {
          position: newPosition,
          prefecture,
          timestamp: Date.now(),
          isNearBoundary,
          confidence
        };

        console.log('Rapid click: using new position with higher confidence:', newClickState);
        return newClickState;
      } else {
        console.log('Rapid click: using previous position with higher confidence:', bestClick);
        return bestClick;
      }
    }

    // No recent clicks, return new position
    const newClickState: ClickPositionState = {
      position: newPosition,
      prefecture,
      timestamp: Date.now(),
      isNearBoundary,
      confidence
    };

    return newClickState;
  }

  /**
   * Clears stored positions for a specific prefecture
   */
  clearPrefecturePositions(prefecture: string): void {
    this.clickHistory = this.clickHistory.filter(
      click => click.prefecture !== prefecture
    );
  }

  /**
   * Clears all stored positions
   */
  clearAllPositions(): void {
    this.clickHistory = [];
  }

  /**
   * Gets statistics about stored click positions
   */
  getClickStatistics(): {
    totalClicks: number;
    boundaryClicks: number;
    averageConfidence: number;
    prefecturesClicked: string[];
  } {
    this.cleanupOldEntries();

    const boundaryClicks = this.clickHistory.filter(click => click.isNearBoundary).length;
    const averageConfidence = this.clickHistory.length > 0
      ? this.clickHistory.reduce((sum, click) => sum + click.confidence, 0) / this.clickHistory.length
      : 0;
    const prefecturesClicked = [...new Set(this.clickHistory.map(click => click.prefecture))];

    return {
      totalClicks: this.clickHistory.length,
      boundaryClicks,
      averageConfidence,
      prefecturesClicked
    };
  }

  private cleanupOldEntries(): void {
    const now = Date.now();
    this.clickHistory = this.clickHistory.filter(
      click => (now - click.timestamp) < this.CLICK_TIMEOUT_MS
    );
  }
}