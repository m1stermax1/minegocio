import { useEffect, useState } from "react";
import { getProfile } from "../../services/users";

export default function DashboardHeader() {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await getProfile();
        if (profile && Array.isArray(profile) && profile.length > 0) {
          const user = profile[0];
          const firstName = user.name || "";
          const lastName = user.last_name || "";
          const fullName = `${firstName} ${lastName}`.trim();
          setUserName(fullName || "Usuario");
        } else {
          setUserName("Usuario");
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        setUserName("Usuario");
      }
    };
    loadUser();
  }, []);

  return (
    <div className="page-header">
      <div>
        <p className="page-header-eyebrow">Panel</p>
        <h1 className="page-title">
          {userName ? `Bienvenido, ${userName}` : "Dashboard"}
        </h1>
      </div>
    </div>
  );
}