import React from "react";
import './Header.css'
import ResetButton from "./ResetButton";

export default function Header() {
    return (
        <header className="header">
            <div className="header-left">
                <ResetButton />
            </div>
            <div className="header-center">
                <h2>Coloración de grafos</h2>
            </div>
            <div className="header-right">
                <h2>Derecha</h2>
            </div>
        </header>
    );
}