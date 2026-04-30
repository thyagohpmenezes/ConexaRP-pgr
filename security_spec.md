# Security Specification

## Data Invariants
1. Users must belong to a specific role. Roles can only be updated by a SuperAdmin.
2. A Company document must be created by a SuperAdmin or Analyst. Clients can only read their own Company.
3. Assessments and ActionPlans must belong to a specific Company.
4. Analysts and TechnicalResponsables can read/write any Assessment.
5. Clients can only read Assessments and ActionPlans where `companyId` matches their assigned `companyId`.
6. Only system admins can delete assessments.

## The Dirty Dozen Payloads
1. User tries to self-assign role 'SuperAdmin' on create `users`.
2. Client user tries to read `users` collection.
3. Client user attempts to create a `Company`.
4. Client user requests `assessments` list without specifying their `companyId`.
5. Non-admin alters `createdAt` field on update of `Company`.
6. SuperAdmin creates `Company` without required fields.
7. Analyst tries to create an `ActionPlan` referencing another company.
8. Injection of massive string for `assessment.status`.
9. Client attempts to modify `ActionPlan.status`.
10. Unauthenticated user attempts to read `companies`.
11. Spoofed payload where `companyId` does not exist during `Assessment` creation.
12. Attempt to create `ActionPlan` where `assessmentId` doesn't exist.

## Test Runner
Defined in `firestore.rules.test.ts`.
