export class GalaxyFocusController {
  private hoveredStarId: number | null = null;
  private selectedStarId: number | null = null;

  updateHoveredStar(nextHoveredStarId: number | null) {
    const previousHoveredStarId = this.hoveredStarId;
    this.hoveredStarId = nextHoveredStarId;

    return {
      changed: previousHoveredStarId !== nextHoveredStarId,
      previousHoveredStarId,
      hoveredStarId: this.hoveredStarId,
      selectedStarId: this.selectedStarId
    };
  }

  selectHoveredStar() {
    const previousSelectedStarId = this.selectedStarId;
    this.selectedStarId = this.hoveredStarId;

    return {
      changed: previousSelectedStarId !== this.selectedStarId,
      previousSelectedStarId,
      selectedStarId: this.selectedStarId,
      hoveredStarId: this.hoveredStarId
    };
  }

  getHoveredStarId() {
    return this.hoveredStarId;
  }

  getSelectedStarId() {
    return this.selectedStarId;
  }

  getActiveStarId() {
    return this.selectedStarId ?? this.hoveredStarId;
  }

  isHighlighted(starId: number) {
    return starId === this.hoveredStarId || starId === this.selectedStarId;
  }
}
