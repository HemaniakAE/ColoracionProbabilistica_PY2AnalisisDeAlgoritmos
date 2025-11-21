import React from "react";
import './Header.css'

export default function Header() {
    return (
        <header className="header">
            <div className="header-left">
                <h2>Izquierda</h2>
            </div>
            <div className="header-center">
                <h2>Centro</h2>
            </div>
            <div className="header-right">
                <h2>Derecha</h2>
            </div>
        </header>
    );
}