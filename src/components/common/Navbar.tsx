import React from "react";
import { ShieldCheck, Bell, UserCheck, Stethoscope, Landmark, Menu, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { useTranslation } from "../../context/LocaleContext";
import { translateData } from "../../i18n/dataTranslations";
import { LanguageSelector } from "./LanguageSelector";
import { SyncStatusIndicator } from "./SyncStatusIndicator";

import { ALL_FARMS_OBJECT } from "../../data/mockData";

interface NavbarProps {
  onToggleMobileNav?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileNav }) => {
  const { role, activeFarm, setActiveFarm, myFarms, allFarms, logout } = useAuth();
  const { unreadCount, setIsDrawerOpen, refreshNotifications } = useNotifications();
  const { t, locale } = useTranslation();

  return (
    <header className="bioshield-navbar">
      <div className="navbar-container">
        {/* Left: Branding & Mobile Menu */}
        <div className="navbar-left">
          <button className="mobile-menu-btn" onClick={onToggleMobileNav} aria-label="Toggle menu">
            <Menu size={22} />
          </button>
          
          <div className="navbar-brand">
            <div className="brand-icon-box">
              <ShieldCheck size={26} color="#FFFFFF" />
            </div>
            <div className="brand-titles">
              <h1 className="brand-name">{t("app.name")}</h1>
              <span className="brand-sub">{t("app.tagline")}</span>
            </div>
          </div>
        </div>

        {/* Center: Read-Only Authenticated Role Indicator */}
        <div className="navbar-center">
          <div className="auth-role-badge">
            {role === "farmer" && (
              <>
                <UserCheck size={16} className="role-icon" />
                <span>{t("role.farmer")} Portal</span>
              </>
            )}
            {role === "veterinarian" && (
              <>
                <Stethoscope size={16} className="role-icon" />
                <span>{t("role.veterinarian")} Portal</span>
              </>
            )}
            {role === "officer" && (
              <>
                <Landmark size={16} className="role-icon" />
                <span>{t("role.officer")} Dashboard</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Farm Selector & Notification Bell */}
        <div className="navbar-right">
          <SyncStatusIndicator />

          <div className="live-badge">
            <span className="live-ping"></span>
            <span>{t("role.liveMonitor")}</span>
          </div>

          {role === "farmer" && <LanguageSelector compact />}

          <div className="farm-selector-wrapper">
            {role === "farmer" ? (
              /* Farmer Portal: Strictly locked to their single logged-in farm */
              <div className="farm-select-dropdown farm-select-readonly" title={activeFarm.location}>
                {translateData(activeFarm.name, locale)} — {translateData(activeFarm.location, locale)} (
                {activeFarm.farmType === "poultry"
                  ? t("status.farmType.poultry")
                  : activeFarm.farmType === "pig"
                  ? t("status.farmType.pig")
                  : t("status.farmType.mixed")}
                )
              </div>
            ) : (
              /* Veterinarian & Officer Portal: Top Right Farm Selector with 'All Farms' work mode */
              <select
                value={activeFarm.id}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "all") {
                    setActiveFarm(ALL_FARMS_OBJECT);
                  } else {
                    const found = allFarms.find((f) => f.id === val);
                    if (found) setActiveFarm(found);
                  }
                }}
                className="farm-select-dropdown"
              >
                <option value="all">🌐 All Farms (Entire District)</option>
                {allFarms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {translateData(farm.name, locale)} — {translateData(farm.location, locale)} (
                    {farm.farmType === "poultry"
                      ? t("status.farmType.poultry")
                      : farm.farmType === "pig"
                      ? t("status.farmType.pig")
                      : t("status.farmType.mixed")}
                    )
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            className="notification-bell-btn"
            onClick={() => {
              void refreshNotifications(true);
              setIsDrawerOpen(true);
            }}
            aria-label="Open notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
          </button>

          <button
            className="logout-btn"
            onClick={logout}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={18} />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
