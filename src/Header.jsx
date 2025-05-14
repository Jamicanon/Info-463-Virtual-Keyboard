import './assets/styles/header.css';

function Header({title}) {
    return (
        <header>
            TYPED: <span>{title}</span>
        </header>
    );
}

export default Header;
