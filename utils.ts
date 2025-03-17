import { Role } from "sanity";

export function getRoleData(role: Role) {
  const roleName = role.name;
  const [location, membershipType] = roleName.split('-')

  return [location, membershipType]
}