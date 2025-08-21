const Popup = ({ onSignIn, onSkip }) => {
    return (
        <div className="Modal-Overlay">
            <div className="Modal">
                <h2>Get Started</h2>
                <br />
                <br />
                <button className="Modal-Button" onClick={onSignIn}>Sign In</button>
                <button className="Modal-Button" onClick={onSkip}>Continue Without</button>
            </div>
        </div>
    );
};

export default Popup;
