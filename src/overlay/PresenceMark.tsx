import { commands } from "@/bindings";

/** Idle glass mark. Hidden while the transcription banner is on screen. */
const PresenceMark = () => {
  return (
    <div
      className="presence"
      role="button"
      aria-label="Open Penny Flow"
      onClick={() => {
        void commands.showMainWindowCommand();
      }}
    >
      <i aria-hidden="true" />
    </div>
  );
};

export default PresenceMark;
