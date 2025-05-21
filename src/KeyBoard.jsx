import "./assets/styles/keyboard.css";

function KeyBoard({ title, handleTitleChange }) {
  const handleKeyPress = (char) => {
    handleTitleChange(title + char);
  };
  const handleBackspace = () => {
    handleTitleChange(title.slice(0, -1));
  };

  const chars0 = [
    { title: "Q", key: 0 },
    { title: "W", key: 1 },
    { title: "E", key: 2 },
    { title: "R", key: 3 },
    { title: "T", key: 4 },
    { title: "Y", key: 5 },
    { title: "U", key: 6 },
    { title: "I", key: 7 },
    { title: "O", key: 8 },
    { title: "P", key: 9 },
  ];
  const chars1 = [
    { title: "A", key: 0 },
    { title: "S", key: 1 },
    { title: "D", key: 2 },
    { title: "F", key: 3 },
    { title: "G", key: 4 },
    { title: "H", key: 5 },
    { title: "J", key: 6 },
    { title: "K", key: 7 },
    { title: "L", key: 8 },
  ];
  const chars2 = [
    { title: "Z", key: 0 },
    { title: "X", key: 1 },
    { title: "C", key: 2 },
    { title: "V", key: 3 },
    { title: "B", key: 4 },
    { title: "N", key: 5 },
    { title: "M", key: 6 },
  ];

  return (
    <div className="keyboard">
      <div className="keyboard-row">
        {chars0.map((char) => (
          <button className="button" key={char.key} onClick={() => handleKeyPress(char.title)}>
            {char.title}
          </button>
        ))}
      </div>
      <div className="keyboard-row">
        {chars1.map((char) => (
          <button className="button" key={char.key} onClick={() => handleKeyPress(char.title)}>
            {char.title}
          </button>
        ))}
      </div>
      <div className="keyboard-row">
        {chars2.map((char) => (
          <button className="button" key={char.key} onClick={() => handleKeyPress(char.title)}>
            {char.title}
          </button>
        ))}
        <button className="button" onClick={handleBackspace}>←</button>
      </div>
      <div className="keyboard-row">
        <button className="button spacebar" onClick={() => handleKeyPress(" ")}>
          Space
        </button>
      </div>
    </div>
  );
}

export default KeyBoard;
