import type { CreateTeamMemberInput } from "@/api/team-members/team-members.types";
import type { TeamMember } from "@/api/team-members/team-members.types";
import type { TeamMemberFormValues } from "./team-member-form";

export function optionalStr(v: string | undefined | null, isEdit: boolean) {
  const t = v?.trim();
  if (t) return t;
  return isEdit ? null : undefined;
}

export function optionalDateIso(v: string | undefined | null, isEdit: boolean) {
  const t = v?.trim();
  if (t) return `${t}T12:00:00.000Z`;
  return isEdit ? null : undefined;
}

export function dateInputFromApi(iso: string | null | undefined) {
  if (!iso) return "";
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
}

export function buildTeamMemberPayload(
  values: TeamMemberFormValues,
  isEdit: boolean,
): CreateTeamMemberInput {
  return {
    userId: values.userId,
    firstName: values.firstName,
    lastName: optionalStr(values.lastName, isEdit),
    secondLastName: optionalStr(values.secondLastName, isEdit),
    businessEmail: values.businessEmail,
    position: values.position,
    salary: values.salary,
    dui: optionalStr(values.dui, isEdit),
    inss: optionalStr(values.inss, isEdit),
    afpNumber: optionalStr(values.afpNumber, isEdit),
    afpEntity: optionalStr(values.afpEntity, isEdit),
    bankName: optionalStr(values.bankName, isEdit),
    bankAccount: optionalStr(values.bankAccount, isEdit),
    bornDate: optionalDateIso(values.bornDate, isEdit),
    startDate: optionalDateIso(values.startDate, isEdit),
    endDate: optionalDateIso(values.endDate, isEdit),
    contractType: values.contractType,
    status: values.status,
    emergencyContactName: optionalStr(values.emergencyContactName, isEdit),
    emergencyContactPhone: optionalStr(values.emergencyContactPhone, isEdit),
    emergencyContactRelationship: optionalStr(
      values.emergencyContactRelationship,
      isEdit,
    ),
    directBossId: values.directBossId,
  };
}

export function teamMemberToFormDefaults(
  teamMember: TeamMember,
): Partial<TeamMemberFormValues> {
  return {
    userId: teamMember.userId,
    firstName: teamMember.firstName,
    lastName: teamMember.lastName ?? "",
    secondLastName: teamMember.secondLastName ?? "",
    businessEmail: teamMember.businessEmail,
    position: teamMember.position,
    salary: teamMember.salary,
    dui: teamMember.dui ?? "",
    inss: teamMember.inss ?? "",
    afpNumber: teamMember.afpNumber ?? "",
    afpEntity: teamMember.afpEntity ?? "",
    bankName: teamMember.bankName ?? "",
    bankAccount: teamMember.bankAccount ?? "",
    bornDate: dateInputFromApi(teamMember.bornDate),
    startDate: dateInputFromApi(teamMember.startDate),
    endDate: dateInputFromApi(teamMember.endDate),
    contractType: teamMember.contractType,
    status: teamMember.status,
    emergencyContactName: teamMember.emergencyContactName ?? "",
    emergencyContactPhone: teamMember.emergencyContactPhone ?? "",
    emergencyContactRelationship:
      teamMember.emergencyContactRelationship ?? "",
    directBossId: teamMember.directBossId,
  };
}
