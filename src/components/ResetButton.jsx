import { PiGraphBold } from "react-icons/pi";
import './ResetButton.css'
import { useNavigate } from "react-router-dom";

export default function ResetButton() {
    const navigate = useNavigate();
    return(
        <button className="reset-button">
            <div className="reset-button-logo" onClick={() => navigate("/")} >   
                <PiGraphBold size={48} />
            </div> 
        </button>
    );
}
