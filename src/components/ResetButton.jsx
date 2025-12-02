import { PiGraphBold } from "react-icons/pi";
import './ResetButton.css'

export default function ResetButton({ onReset }) {
    const handleReset = () => {
        console.log("ResetButton clicked, onReset:", onReset);
        if (onReset) {
            console.log("Calling onReset...");
            onReset();
            console.log("onReset completed");
        } else {
            console.log("onReset is not defined");
        }
    };

    return(
        <button className="reset-button" onClick={handleReset}>
            <div className="reset-button-logo">   
                <PiGraphBold size={48} />
            </div> 
        </button>
    );
}
