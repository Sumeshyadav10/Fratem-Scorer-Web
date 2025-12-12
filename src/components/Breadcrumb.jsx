import React from "react";
import "./Breadcrumb.css";

/**
 * Breadcrumb Navigation Component
 * Shows user location hierarchy and allows quick navigation
 */
const Breadcrumb = ({ path, onNavigate }) => {
  if (!path || path.length === 0) return null;

  return (
    <div className="breadcrumb-container">
      <nav className="breadcrumb">
        {path.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="breadcrumb-separator">›</span>}
            <button
              className={`breadcrumb-item ${
                index === path.length - 1 ? "active" : ""
              }`}
              onClick={() => {
                if (index < path.length - 1 && item.view) {
                  onNavigate(item.view, item.matchId);
                }
              }}
              disabled={index === path.length - 1}
            >
              {item.icon && (
                <span className="breadcrumb-icon">{item.icon}</span>
              )}
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
};

export default Breadcrumb;
