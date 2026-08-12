# frozen_string_literal: true

# Run inside the existing OpenProject web container:
#   docker compose exec -T web bundle exec rails runner - \
#     < /path/to/provision_openproject.rb
#
# This script is intentionally credential-free and idempotent. It creates a separate
# STEER coordination workspace and never modifies the historical Scrum pilot.

require "json"
require "securerandom"

admin = User.find_by!(login: "admin")
User.current = admin

project = Project.find_or_initialize_by(identifier: "steer-federal-bd-platform")
project.name = "STEER Federal BD Platform"
project.public = false
project.workspace_type = "project"
project.description = <<~MARKDOWN
  Coordination projection for the STEER federal business-development experiment.

  **Authority:** [GitHub](https://github.com/idrissenayat/federal-bd-platform) and its
  versioned `/steer` directory. This OpenProject workspace is a non-authoritative mirror
  during the Buzz pilot. Agents cannot approve STEER gates or final bid/no-bid decisions.

  The historical `Agentic End2End SDLC` Scrum pilot remains separate and unchanged.
MARKDOWN

unless project.persisted?
  result = Projects::CreateService.new(user: admin, model: project).call(
    name: project.name,
    identifier: project.identifier,
    workspace_type: "project",
    description: project.description,
    public: false
  )
  raise result.errors.full_messages.join("; ") if result.failure?

  project = result.result
end

project.enabled_module_names = %w[
  work_package_tracking
  board_view
  documents
  wiki
]
project.types = Type.where(name: ["Epic", "User story", "Task", "Bug", "Milestone"])
project.save!

project_admin = Role.find_by!(name: "Project admin")
admin_membership = Member.find_or_initialize_by(project: project, user_id: admin.id)
admin_membership.roles = [project_admin]
admin_membership.save!

base_permissions = %i[
  view_project
  view_work_packages
  work_package_assigned
  view_members
  view_project_activity
  search_project
  show_board_views
  view_project_query
  view_work_package_watchers
].freeze

evidence_permissions = (base_permissions + %i[
  add_work_package_comments
  edit_own_work_package_comments
  add_work_package_attachments
]).uniq.freeze

coordinate_permissions = (evidence_permissions + %i[
  add_work_packages
  edit_work_packages
  change_work_package_status
  manage_subtasks
  manage_work_package_relations
  save_queries
  manage_public_queries
  edit_project_query
  manage_board_views
  export_work_packages
]).uniq.freeze

evidence_role = ProjectRole.find_or_initialize_by(name: "STEER Evidence Agent")
evidence_role.permissions = evidence_permissions
evidence_role.save!

coordinate_role = ProjectRole.find_or_initialize_by(name: "STEER Flow Steward")
coordinate_role.permissions = coordinate_permissions
coordinate_role.save!

agents = {
  "agent-scout-business-analyst" => evidence_role,
  "agent-bolt-backend-engineer" => evidence_role,
  "agent-bugsy-qa-engineer" => evidence_role,
  "agent-tempo-scrum-master" => coordinate_role
}.freeze

agents.each do |login, role|
  user = User.find_by!(login: login)
  membership = Member.find_or_initialize_by(project: project, user_id: user.id)
  membership.roles = [role]
  membership.save!
end

critic = User.find_or_initialize_by(login: "agent-critic-steer")
critic.firstname = "Critic"
critic.lastname = "STEER Fresh Context"
critic.mail = "agent-critic-steer@agentic-sdlc.local"
critic.admin = false
critic.status = User.statuses.fetch(:active)
critic.language = "en"
if critic.new_record?
  password = "Aa1!#{SecureRandom.hex(32)}"
  critic.password = password
  critic.password_confirmation = password
end
critic.force_password_change = false
critic.save!

critic_membership = Member.find_or_initialize_by(project: project, user_id: critic.id)
critic_membership.roles = [evidence_role]
critic_membership.save!

unless project.work_packages.exists?(subject: "Prove Buzz B1 human-agent communication")
  result = WorkPackages::CreateService.new(user: admin).call(
    project: project,
    subject: "Prove Buzz B1 human-agent communication",
    type: Type.find_by!(name: "Task"),
    status: Status.find_by!(name: "New"),
    priority: IssuePriority.find_by!(name: "High"),
    description: <<~MARKDOWN
      Non-authoritative coordination projection. Durable setup and evidence live in:
      https://github.com/idrissenayat/federal-bd-platform

      **B1 exit evidence**

      - Unique human and minimum-fleet agent identities authenticate.
      - `#huddle`, `#signals`, `#escalations`, `#critic-findings`, `#release-watch`, and
        `#learning-review` enforce membership and retain attributed history.
      - Every active role passes one allowed-action and one denied-action test.
      - Signal, escalation, and fresh-context Critic paths write through to GitHub.
      - Credential revocation stops access without deleting the event history.

      This item cannot approve a STEER gate.
    MARKDOWN
  )
  raise result.errors.full_messages.join("; ") if result.failure?
end

puts JSON.generate(
  project_id: project.id,
  identifier: project.identifier,
  name: project.name,
  public: project.public,
  members: User.where(id: Member.where(project: project).pluck(:user_id)).pluck(:login).sort,
  roles: Member.where(project: project).joins(:roles).distinct.pluck("roles.name").sort,
  work_packages: project.work_packages.count,
  api_tokens_created: 0,
  preserved_project: Project.exists?(identifier: "agentic-end2end-sdlc")
)
