import { useState } from "react";
import "./assets/styles/App.css";
import Header from "./Header.jsx";
import KeyBoard from "./KeyBoard.jsx";
import WritingTablet from "./WritingTablet.jsx";
import ArrowButton from "./ArrowButton.jsx";
function App() {
  const [title, setTitle] = useState("");

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
  };

  return (
    <div className="app">
      <Header title={title} />
      <div className="container">
        <KeyBoard title={title} handleTitleChange={handleTitleChange} />
        <ArrowButton />
        <WritingTablet title={title} handleTitleChange={handleTitleChange} />
      </div>
    </div>
  );
}

export default App;
