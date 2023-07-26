import React from 'react';
import './App.css';
import logo from './logo.svg';

function Header() {
    return(
    <header className="header">
        <img className="logo" src={logo} alt="Foundry"/>
        <nav className="header-nav">
            <ul>
                <li className="nav-item"><a href="#">Home</a></li>
                <li className="nav-item"><a href="#">About</a></li>
            </ul>
        </nav>
    </header>
    );
}

export default Header;