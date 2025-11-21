import { PiGraphBold } from "react-icons/pi";
import './ResetButton.css'

export default function ResetButton() {
    return(
        <button className="reset-button">
            <div className="reset-button-logo">   
                <PiGraphBold size={48} />
            </div> 
        </button>
    );
}
