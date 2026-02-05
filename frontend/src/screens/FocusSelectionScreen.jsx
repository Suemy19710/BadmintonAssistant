import React from "react";
import StepContainer from "../components/StepContainer";
import PrimaryButton from "../components/PrimaryButton";
import { FOCUS_AREAS } from "../constants/Setup";

const FocusSelectionScreen = ({
  currentTheme,
  theme,
  onToggleTheme,
  onBack,
  selectedFocusAreas,
  setSelectedFocusAreas,
  isLoading,
  onRunAnalysis,
}) => {
  const selectionText =
    selectedFocusAreas.length === 0
      ? "Choose at least one focus area."
      : selectedFocusAreas.length === 1
        ? `You chose ${selectedFocusAreas[0]}.`
        : `You chose ${selectedFocusAreas.slice(0, -1).join(", ")} and ${selectedFocusAreas.slice(-1)}.`;

  return (
    <StepContainer
      title="Select Focus Areas"
      currentTheme={currentTheme}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
    >
      <div className="space-y-6 flex-1 flex flex-col">
        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedFocusAreas(FOCUS_AREAS)}
            className={`px-3 py-2 rounded-lg text-xs ${currentTheme.card} ${currentTheme.text}`}
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => setSelectedFocusAreas([])}
            className={`px-3 py-2 rounded-lg text-xs ${currentTheme.card} ${currentTheme.text}`}
          >
            Clear
          </button>
        </div>

        {/* Multi-select list */}
        <div className="grid gap-3">
          {FOCUS_AREAS.map((area) => {
            const selected = selectedFocusAreas.includes(area);
            return (
              <button
                key={area}
                type="button"
                onClick={() => {
                  setSelectedFocusAreas((prev) =>
                    prev.includes(area)
                      ? prev.filter((a) => a !== area)
                      : [...prev, area]
                  );
                }}
                className={`p-4 rounded-xl text-left border-2 flex items-center justify-between transition-all ${
                  selected
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold"
                    : `${currentTheme.card} ${currentTheme.accent} ${currentTheme.text}`
                }`}
              >
                {area}
              </button>
            );
          })}
        </div>

        {/* Selection sentence */}
        <p className={`text-sm ${currentTheme.text} opacity-80`}>
          {selectionText}
        </p>

        {/* CTA */}
        <div className="mt-auto">
          <PrimaryButton
            disabled={selectedFocusAreas.length === 0 || isLoading}
            onClick={onRunAnalysis}
            currentTheme={currentTheme}
          >
            {isLoading ? "Analyzing…" : "Run AI Analysis"}
          </PrimaryButton>
        </div>
      </div>
    </StepContainer>
  );
};

export default FocusSelectionScreen;
