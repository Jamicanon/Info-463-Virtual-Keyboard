import './assets/styles/header.css';
import { useState, useEffect } from 'react';
import sentences from './sentences.json';

function Header({ title }) {
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
    const [currentSentence, setCurrentSentence] = useState(sentences[0]);

    const nextSentence = () => {
        setCurrentSentenceIndex(prev => {
            const nextIndex = (prev + 1) % sentences.length;
            setCurrentSentence(sentences[nextIndex]);
            return nextIndex;
        });
    };

    return (
        <header>
            SENTENCE: <span>{currentSentence}</span>
            <br />
            TYPED: <span>{title}</span>
            <br />
            <button className="next-button" onClick={nextSentence}>Next Sentence</button>
        </header>
    );
}

export default Header;
