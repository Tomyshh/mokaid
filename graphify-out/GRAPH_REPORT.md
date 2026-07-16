# Graph Report - .  (2026-07-16)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 3116 nodes · 6362 edges · 274 communities (163 shown, 111 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 203 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `459a01f0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 156
- Community 157
- Community 158
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 171
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Community 185
- Community 186
- Community 187
- Community 188
- Community 189
- Community 190
- Community 191
- Community 192
- Community 193
- Community 194
- Community 195
- Community 196
- Community 197
- Community 198
- Community 199
- Community 200
- Community 201
- Community 202
- Community 203
- Community 204
- Community 205
- Community 206
- Community 207
- Community 208
- Community 209
- Community 210
- Community 211
- Community 212
- Community 213
- Community 214
- Community 215
- Community 216
- Community 217
- Community 218
- Community 219
- Community 220
- Community 221
- Community 222
- Community 223
- Community 224
- Community 225
- Community 226
- Community 227
- Community 228
- Community 229
- Community 230
- Community 231
- Community 232
- Community 233
- Community 234
- Community 235
- Community 236
- Community 237
- Community 238
- Community 239
- Community 240
- Community 241
- Community 242
- Community 243
- Community 244
- Community 245
- Community 246
- Community 247
- Community 248
- Community 249
- Community 250
- Community 272
- Community 273

## God Nodes (most connected - your core abstractions)
1. `cn()` - 127 edges
2. `apiFetch()` - 96 edges
3. `OfficeScene` - 51 edges
4. `useAuthStore` - 50 edges
5. `Button` - 40 edges
6. `RunRequest` - 39 edges
7. `MokaidWeb.JSON` - 39 edges
8. `Mokaid.AgentChat` - 34 edges
9. `Mokaid.AI.Dispatcher` - 34 edges
10. `PhoenixClient` - 33 edges

## Surprising Connections (you probably didn't know these)
- `test_looks_like_text_rejects_decoded_binary()` --calls--> `looks_like_text()`  [INFERRED]
  apps/ai-worker/tests/test_extractors.py → apps/ai-worker/app/memory/extractors.py
- `test_corrupt_docx_returns_none()` --calls--> `extract_bytes()`  [INFERRED]
  apps/ai-worker/tests/test_extractors.py → apps/ai-worker/app/memory/extractors.py
- `test_empty_input_returns_none()` --calls--> `extract_bytes()`  [INFERRED]
  apps/ai-worker/tests/test_extractors.py → apps/ai-worker/app/memory/extractors.py
- `test_max_chars_cap()` --calls--> `extract_bytes()`  [INFERRED]
  apps/ai-worker/tests/test_extractors.py → apps/ai-worker/app/memory/extractors.py
- `test_plain_text_and_csv()` --calls--> `extract_bytes()`  [INFERRED]
  apps/ai-worker/tests/test_extractors.py → apps/ai-worker/app/memory/extractors.py

## Import Cycles
- None detected.

## Communities (274 total, 111 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (67): analyze_file(), _download(), extract_document_text(), _pick_attached_file(), Any, File processing tools: image modification, analysis, audio transcription, docume, Download a file from a presigned URL., Analyze any file (image, document) using GPT-4 Vision and return a text descript (+59 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (45): ApiError, apiUpload(), fetchWorkspaceLogoBlob(), RequestOptions, useFigmaOauthStart(), useGithubOauthStart(), useGoogleOauthStart(), useLinearOauthStart() (+37 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (53): useUploadAgentFiles(), KnowledgeItem, ProjectActivity, AgentAvatar(), AgentAvatarSize, AgentAvatarSource, AgentHeadPreview3D, SIZE_PX (+45 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (42): useApproveTaskAction(), useDeleteTask(), useStopTaskAi(), useTask(), useToggleSubtask(), useUpdateTask(), AgentChatSummary, ReviewBanner() (+34 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (59): asks_for_file_deliverable(), ChatDecision, _decide(), detect_language(), _download_bytes(), _format_attachments(), _format_tasks(), _language_name() (+51 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (56): apiFetch(), useAgent(), useAgentChatMessages(), useAgentChats(), useAgentConversations(), useAgentMcpGrants(), useAgentProgression(), useAnalyticsOverview() (+48 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (8): playAgentAnimation(), poiById(), nearestWaypointIndex(), pickPathNear(), isIdleVisual(), OfficeScene, readOfficeCamOverride(), SceneCallbacks

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (40): simulate(), Aabb2, cellOf(), DeskSeat, DIRS, dist2(), findPath(), FindPathOptions (+32 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (25): useCancelInvite(), useDeleteProject(), useInviteMember(), useLinkMemberAgent(), useRemoveMember(), useUpdateMember(), useUpdateProject(), MemberDetailPanel() (+17 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (40): Agent, AgentArchetype, AgentBoostTier, AgentCapabilities, AgentCatalog, AgentCounts, AgentLearning, AgentProgression (+32 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (35): MokaidWeb.JSON, agent(), agent_chat_message(), calendar_event(), chat_attachments(), comment(), comments(), drive_item() (+27 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (37): useAttachTaskFile(), useCreateCalendarEvent(), useCreateFolder(), useCreateKnowledge(), useCreateProject(), useCreateTask(), useDispatchAnalyze(), useExecuteAi() (+29 more)

### Community 12 - "Community 12"
Cohesion: 0.06
Nodes (38): CalendarEvent, Project, Task, Badge(), BadgeProps, dotColor, Tone, toneClasses (+30 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (27): AGENT_GLB_URL, AgentAnimPlayer, AgentModelTemplate, applyTint(), cacheFor(), CLIP_ALIASES, disposeAgentAnims(), findNamedNode() (+19 more)

### Community 14 - "Community 14"
Cohesion: 0.05
Nodes (37): devDependencies, @eslint/js, eslint-plugin-react-hooks, jsdom, postcss, prettier, tailwindcss, @testing-library/jest-dom (+29 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (30): _build_model(), _colleagues_block(), _conversation_block(), _deliverable_rule(), _describe_action(), _Engine, execute(), _files_block() (+22 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (28): Asset3d, BillingPlanSummary, useAgentCatalog(), useAssets3d(), useBillingOverview(), useCreateAgent(), useCreditsCheckout(), usePlanCheckout() (+20 more)

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (32): language_for_request(), cancel_run_task(), _describe_action(), _execute_deep(), execute_run(), _force_producer_tool(), _is_refusal(), _pause_for_user_input() (+24 more)

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (30): Mokaid.AgentChat, acknowledgement_message(), active_conversation(), archive_conversation(), auto_title(), broadcast_message(), chat_task_title(), create_conversation() (+22 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (29): Mokaid.AI.Dispatcher, agent_score(), analyze(), apply_grants(), build_normalized(), clamp_confidence(), confirm(), connected_installations() (+21 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (24): env, envSchema, SceneState, useSceneStore, AgentSceneLabel, stateColor, stateText, applyLabelPositions() (+16 more)

### Community 21 - "Community 21"
Cohesion: 0.10
Nodes (21): Mokaid.Billing, agent_limit(), apply_invoice_effect(), change_plan(), charge_renewal(), create_pending_invoice(), create_settled_invoice(), create_subscription() (+13 more)

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (23): fetchDriveFileBlob(), useDriveItems(), useMoveDriveItem(), useMoveDriveItems(), useRestoreDriveItem(), useTrashDriveItem(), useTrashDriveItems(), ChatAttachment (+15 more)

### Community 23 - "Community 23"
Cohesion: 0.12
Nodes (14): PhoenixClient, Any, HTTP client for the Phoenix API worker endpoints (callbacks + resources)., Semantic search over knowledge chunks (pgvector on the Phoenix         side). Re, Stores embedded chunks for a knowledge item and marks it indexed., Marks a knowledge item's indexing as failed (unreadable file…)., Posts a task comment authored by the agent (conversational replies)., Posts the agent's reply in its direct chat thread (floating dock).          When (+6 more)

### Community 24 - "Community 24"
Cohesion: 0.06
Nodes (30): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+22 more)

### Community 25 - "Community 25"
Cohesion: 0.06
Nodes (31): dependencies, @babylonjs/core, framer-motion, gsap, @hookform/resolvers, lucide-react, @mokaid/design-tokens, @mokaid/shared-types (+23 more)

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (25): useCreateWorkspace(), useDispatchConfirm(), useInstallMcp(), DispatchAnalysis, DispatchFileInput, Workspace, AskBar(), makePending() (+17 more)

### Community 27 - "Community 27"
Cohesion: 0.07
Nodes (25): AnalyticsPage(), GithubCallbackPage(), GoogleCallbackPage(), LinearCallbackPage(), NotionCallbackPage(), TermsPage(), appRoute, figmaCallbackRoute (+17 more)

### Community 28 - "Community 28"
Cohesion: 0.09
Nodes (15): Mokaid.Tasks, active_runs_for_task(), assign_task(), create_comment(), create_task(), detail_preloads(), get_task(), list_tasks() (+7 more)

### Community 29 - "Community 29"
Cohesion: 0.10
Nodes (7): Mokaid.Billing.Workers.UsageAggregationWorker, Mokaid.Repo, Mokaid.Tasks.Workers.OverdueTaskWorker, MokaidWeb.SearchController, Mokaid.MembersTest, Mokaid.ProjectsTest, Mokaid.DataCase

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (27): Mokaid.AI, cancel_active_runs_for_task(), cancel_run(), chat_completion_ack(), chat_delivery_message(), chat_output_attachments(), conversation_entries(), default_input() (+19 more)

### Community 31 - "Community 31"
Cohesion: 0.16
Nodes (25): AppNotification, NotificationRow(), TONE_DOT, TONE_EYEBROW, actionKind(), alreadyFriendly(), capitalizeSentence(), defaultEyebrow() (+17 more)

### Community 32 - "Community 32"
Cohesion: 0.16
Nodes (25): append_accessor(), BufferBuilder, build_clip(), finger_curl(), load_glb(), main(), make_channel(), node_index_by_name() (+17 more)

### Community 33 - "Community 33"
Cohesion: 0.13
Nodes (5): Mokaid.AI.Workers.ConverseWorker, MokaidWeb.TaskChannel, Mokaid.AgentChatTest, Mokaid.NotificationsTest, Mokaid.OfficeTest

### Community 34 - "Community 34"
Cohesion: 0.12
Nodes (20): Mokaid.Knowledge, create_from_upload(), create_item(), enqueue_ingestion(), extractable_filename?(), fuse_results(), ingestable_file?(), inline_body() (+12 more)

### Community 35 - "Community 35"
Cohesion: 0.09
Nodes (11): Mokaid.Members, add_owner(), count_active_owners(), create_invite(), get_role_by_name(), list_leave_requests(), maybe_filter_member(), maybe_filter_status() (+3 more)

### Community 36 - "Community 36"
Cohesion: 0.19
Nodes (24): append_accessor(), BufferBuilder, build_mixamo_clip(), copy_accessor(), load_glb(), main(), make_channel(), merge_walking() (+16 more)

### Community 37 - "Community 37"
Cohesion: 0.15
Nodes (18): Pauses the run for approval when the tool is risky. Returns         (approved, e, Executes one gated tool call and records it on the run state., producer_tool_succeeded(), Approval policy — decides which tool calls require a human in the loop.  Mirrors, MCP tools default to MEDIUM; sensitive writes are gated behind approval., requires_approval(), _risk_for_mcp_tool(), risk_for_tool() (+10 more)

### Community 38 - "Community 38"
Cohesion: 0.12
Nodes (21): chunk_text(), contextualize(), _download(), ingest_document(), Any, Document ingestion pipeline.  fetch text (inline, or downloaded + extracted from, Ingest a knowledge item. Returns chunk/embedding stats., Structure-aware chunking via LangChain's recursive splitter. (+13 more)

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (18): Logo(), Button, completeOauthInPopup(), consumeOauthReturn(), notifyOauthOpener(), OAUTH_SUCCESS_MESSAGE, oauthDedupeKey(), oauthInflight (+10 more)

### Community 40 - "Community 40"
Cohesion: 0.10
Nodes (21): GlobalSearch(), SearchResults, sections, mainNav, NavItem(), Sidebar(), workspaceNav, agentCards (+13 more)

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (16): _auth_headers(), is_write_tool(), McpToolbox, Any, qualified_name(), MCP client: connects to the remote MCP servers granted to an agent.  Tools are d, Returns (server_key, tool_name) for a qualified MCP tool name., Discovered MCP tools for one run, keyed by qualified name. (+8 more)

### Community 42 - "Community 42"
Cohesion: 0.19
Nodes (21): append_accessor(), BufferBuilder, build_clip(), detect_rig(), load_glb(), main(), make_channel(), node_index_by_name() (+13 more)

### Community 43 - "Community 43"
Cohesion: 0.24
Nodes (22): MokaidWeb.IntegrationOAuthController, default_github_redirect_uri(), default_google_redirect_uri(), default_linear_redirect_uri(), default_notion_redirect_uri(), default_slack_redirect_uri(), ensure_same_workspace(), forbidden() (+14 more)

### Community 44 - "Community 44"
Cohesion: 0.14
Nodes (19): AgentChatMessage, BillingOverview, Envelope, queryClient, bumpUnreadCount(), EventPayload, insertChatMessage(), maybeToast() (+11 more)

### Community 45 - "Community 45"
Cohesion: 0.21
Nodes (20): _cell_str(), _ext(), extract_bytes(), _extract_docx(), _extract_pdf(), extract_pdf_annotations(), _extract_plain_text(), _extract_pptx() (+12 more)

### Community 46 - "Community 46"
Cohesion: 0.21
Nodes (22): _anthropic_chat(), _anthropic_model(), chat(), chat_stream(), chat_structured(), _deepseek_chat(), _deepseek_model(), generate_long() (+14 more)

### Community 47 - "Community 47"
Cohesion: 0.10
Nodes (8): Mokaid.Billing.Workers.AutoRechargeWorker, charge_and_credit(), perform(), Mokaid.Billing.Workers.InvoiceCleanupWorker, Mokaid.Billing.Workers.SubscriptionRenewalWorker, Mokaid.AgentsTest, Mokaid.BillingTest, Mokaid.AI.DispatcherTest

### Community 48 - "Community 48"
Cohesion: 0.17
Nodes (16): Mokaid.Integrations, connect(), connect_github_provider(), connect_google_providers(), connect_linear_provider(), connect_mock(), connect_notion_provider(), connect_slack_provider() (+8 more)

### Community 49 - "Community 49"
Cohesion: 0.15
Nodes (18): AgentAnimMap, AgentAnimName, cacheAvailable(), fetchAssetCached(), pruneStale(), readWithProgress(), OFFICE_BLOOM, OFFICE_CAMERA (+10 more)

### Community 50 - "Community 50"
Cohesion: 0.18
Nodes (17): detect_mission_kind(), Prefer explicit metadata from Phoenix; fall back to instruction heuristics., required_tool_for_kind(), RunRequest, test_mission_kind_from_metadata(), test_mission_kind_research_before_logo(), test_mission_kind_research_report_is_document(), test_mission_kind_website_from_instruction() (+9 more)

### Community 51 - "Community 51"
Cohesion: 0.14
Nodes (11): Mokaid.Agents, active_agent_count(), blank?(), change_status(), create_agent(), find_free_seat(), list_agents(), maybe_filter() (+3 more)

### Community 52 - "Community 52"
Cohesion: 0.23
Nodes (17): append_accessor(), BufferBuilder, find_walking(), load_glb(), main(), node_index_by_name(), pack_f32(), Any (+9 more)

### Community 53 - "Community 53"
Cohesion: 0.16
Nodes (13): edit_image(), embed(), generate_image(), _get_client(), Accumulates token usage and cost across all LLM calls of a run., GPT-4o vision: analyze an image with a text prompt.      Private URLs (localhost, Text-to-image generation with the configured image model. Returns the     image, AI image editing: transforms the ORIGINAL image per the prompt,     preserving i (+5 more)

### Community 54 - "Community 54"
Cohesion: 0.11
Nodes (6): FakePhoenixClient, offline_llm(), phoenix(), Any, Tests never call an LLM provider: force the no-key fallback paths., Records callbacks instead of making HTTP requests.

### Community 55 - "Community 55"
Cohesion: 0.13
Nodes (19): make_docx(), make_pdf(), make_pptx(), make_xlsx(), Extractor tests with generated fixtures — no LLM, no network.  Each fixture is b, test_corrupt_docx_returns_none(), test_docx_extraction_headings_and_tables(), test_empty_input_returns_none() (+11 more)

### Community 56 - "Community 56"
Cohesion: 0.12
Nodes (7): Mokaid.Audit, actor_info(), log(), MokaidWeb.DispatchController, authorize_custom_agent(), confirm(), MokaidWeb.MemberController

### Community 57 - "Community 57"
Cohesion: 0.12
Nodes (6): Mokaid.Notifications, list_for_user(), notify(), notify_member(), notify_roles(), task_meta_by_id()

### Community 58 - "Community 58"
Cohesion: 0.16
Nodes (16): build_acknowledgement(), _fallback_reply(), post_acknowledgement(), Any, Conversational acknowledgement posted when an agent picks up a task.  Before pla, Builds and posts the acknowledgement comment; never raises., Returns the agent's conversational reply for the assigned task., deterministic_plan() (+8 more)

### Community 59 - "Community 59"
Cohesion: 0.27
Nodes (17): answer(), check(), Corpus, cosine(), index_documents(), main(), make_finance_xlsx(), make_legal_docx() (+9 more)

### Community 60 - "Community 60"
Cohesion: 0.14
Nodes (11): Mokaid.Calendar, create_event(), create_leave_event(), list_events(), maybe_filter(), maybe_range(), MokaidWeb.CalendarController, MokaidWeb.LeaveRequestController (+3 more)

### Community 61 - "Community 61"
Cohesion: 0.20
Nodes (14): Mokaid.Drive, actor_attrs(), create_file(), create_folder(), create_project_folder_tree(), create_version(), ensure_system_folder(), filter_parent() (+6 more)

### Community 62 - "Community 62"
Cohesion: 0.21
Nodes (14): Mokaid.Agents.SkillLearning, detect_categories(), detect_from_text_and_files(), detect_output_categories(), dominant_domain(), get_file_names(), get_learning(), increment_learning() (+6 more)

### Community 63 - "Community 63"
Cohesion: 0.20
Nodes (14): Mokaid.Integrations.LogoAssets, content_type(), find_file(), seed_one(), upload(), Mokaid.Storage, download_url(), get_object() (+6 more)

### Community 64 - "Community 64"
Cohesion: 0.14
Nodes (7): MokaidWeb.MCPController, MokaidWeb.MCPOAuthController, default_redirect_uri(), ensure_same_workspace(), figma_callback(), figma_start(), Mokaid.MCPTest

### Community 65 - "Community 65"
Cohesion: 0.15
Nodes (8): Mokaid.MCP, authorized_servers_for_agent(), compact(), decrypted_credentials(), get_server_by_key(), install(), maybe_put_credentials(), store_credentials()

### Community 66 - "Community 66"
Cohesion: 0.15
Nodes (7): MokaidWeb.DriveController, file_extension(), get_trashed_item(), raw(), restore(), sanitize_filename(), upload()

### Community 67 - "Community 67"
Cohesion: 0.20
Nodes (13): AgentAlternative, analyze(), CustomAgentSpec, DispatchAnalysis, DispatchRecommendation, DispatchTask, McpSuggestion, Any (+5 more)

### Community 68 - "Community 68"
Cohesion: 0.21
Nodes (10): Mokaid.Agents.Archetypes, blank_to_nil(), build_create_attrs(), fetch_archetype(), fetch_boost(), get_archetype(), get_boost(), maybe_put_brief() (+2 more)

### Community 69 - "Community 69"
Cohesion: 0.30
Nodes (13): Mokaid.Billing.Credits, broadcast(), broadcast_balance(), can_start_task?(), charge_run(), cost_cents_to_credits(), do_charge(), get_subscription() (+5 more)

### Community 70 - "Community 70"
Cohesion: 0.21
Nodes (10): MokaidWeb.BillingController, change_plan(), checkout(), credits_checkout(), open_checkout(), overview(), put_if(), safe_return_path() (+2 more)

### Community 71 - "Community 71"
Cohesion: 0.18
Nodes (9): MokaidWeb.WorkerResourceController, agent_chat_message(), decode_content(), file_extension(), maybe_start_chat_task(), presence(), recover_attachments(), save_output() (+1 more)

### Community 72 - "Community 72"
Cohesion: 0.15
Nodes (11): ButtonProps, Size, sizeClasses, Variant, variantClasses, useSmoothScroll(), featureGroups, LandingPage() (+3 more)

### Community 73 - "Community 73"
Cohesion: 0.33
Nodes (12): append_accessor(), BufferBuilder, copy_accessor(), copy_animation(), find_anim(), load_glb(), main(), node_index_by_name() (+4 more)

### Community 74 - "Community 74"
Cohesion: 0.18
Nodes (13): _colleague_knowledge(), consult(), find_colleague(), Any, Agent-to-agent consultation.  Gives the running deep agent a `consult_colleague`, Retrieves the colleague's own vectorized knowledge relevant to the     question,, Runs one consultation round and posts both sides in the task thread., AttachedFile (+5 more)

### Community 75 - "Community 75"
Cohesion: 0.23
Nodes (13): agent_chat(), cancel_run(), _check_auth(), converse(), dispatch_analyze(), ingest(), Chat reply in a task thread while the agent is idle. The reply is     posted bac, Direct-chat reply (agent DM thread). The reply is posted back through     the Ph (+5 more)

### Community 76 - "Community 76"
Cohesion: 0.15
Nodes (4): Mokaid.Analytics, avg_completion_hours(), overview(), MokaidWeb.AnalyticsController

### Community 77 - "Community 77"
Cohesion: 0.16
Nodes (6): Mokaid.Vault, decrypt(), decrypt_map(), key(), MokaidWeb.IntegrationController, Mokaid.VaultTest

### Community 78 - "Community 78"
Cohesion: 0.22
Nodes (7): Mokaid.Agents.Agent, cast_and_validate(), office_activity_changeset(), put_slug(), random_suffix(), validate_linked_user(), validate_optional_inclusion()

### Community 79 - "Community 79"
Cohesion: 0.32
Nodes (11): Mokaid.Integrations.GoogleOAuth, authorize_url(), config(), configured?(), ensure_configured(), exchange_code(), fetch_account_email(), google_provider?() (+3 more)

### Community 80 - "Community 80"
Cohesion: 0.19
Nodes (6): Mokaid.Projects, create_project(), list_projects(), maybe_filter_status(), record_activity(), update_project()

### Community 81 - "Community 81"
Cohesion: 0.15
Nodes (12): name, private, scripts, build, dev, format, lint, preview (+4 more)

### Community 82 - "Community 82"
Cohesion: 0.36
Nodes (12): accessor_f32(), append_f32(), detect_lower(), first_frame_tracks(), load_glb(), main(), patch_clip(), patch_file() (+4 more)

### Community 83 - "Community 83"
Cohesion: 0.27
Nodes (10): _dsn(), _ensure_initialized(), get_checkpointer(), is_configured(), load_run_request(), Any, Run persistence: LangGraph Postgres checkpointer + saved run requests.  When `DA, Opens the pool, sets up checkpointer tables + our run-request table.     Returns (+2 more)

### Community 84 - "Community 84"
Cohesion: 0.33
Nodes (9): Mokaid.Integrations.GitHubOAuth, authorize_url(), config(), configured?(), ensure_configured(), exchange_code(), fetch_account_login(), request_tokens() (+1 more)

### Community 85 - "Community 85"
Cohesion: 0.33
Nodes (9): Mokaid.Integrations.LinearOAuth, authorize_url(), config(), configured?(), ensure_configured(), exchange_code(), fetch_account(), request_tokens() (+1 more)

### Community 87 - "Community 87"
Cohesion: 0.18
Nodes (3): MokaidWeb.TaskController, default_run_input(), execute_ai()

### Community 88 - "Community 88"
Cohesion: 0.33
Nodes (8): Mokaid.Billing.PayMe, base_url(), callback_url(), charge_buyer(), config(), generate_hosted_sale(), maybe_put(), return_url()

### Community 89 - "Community 89"
Cohesion: 0.36
Nodes (8): Mokaid.Integrations.NotionOAuth, authorize_url(), config(), configured?(), ensure_configured(), exchange_code(), request_tokens(), validate_redirect_uri()

### Community 90 - "Community 90"
Cohesion: 0.38
Nodes (8): Mokaid.Integrations.SlackOAuth, authorize_url(), config(), configured?(), ensure_configured(), exchange_code(), request_tokens(), validate_redirect_uri()

### Community 91 - "Community 91"
Cohesion: 0.18
Nodes (10): description, engines, node, name, private, version, workspaces, apps/web (+2 more)

### Community 92 - "Community 92"
Cohesion: 0.35
Nodes (10): aabb_from_points(), band_ok(), grid_boxes(), islands_of(), main(), Vector, Exhaustive obstacle dump from office.blend for runtime collision.  For every mes, Connected-component AABBs in glTF space. (+2 more)

### Community 93 - "Community 93"
Cohesion: 0.27
Nodes (9): get_settings(), Settings, is_configured(), _configure_langsmith(), lifespan(), Env-gated LangSmith tracing: with a key set, every deep-agent run,     LLM call, consume_forever(), BaseSettings (+1 more)

### Community 94 - "Community 94"
Cohesion: 0.44
Nodes (9): Mokaid.MCP.FigmaOAuth, authorize_url(), config(), configured?(), ensure_configured(), exchange_code(), fetch_account_email(), request_tokens() (+1 more)

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (8): MokaidWeb.WorkspaceController, authorize_same_workspace(), delete(), logo(), show(), update(), upload_logo(), validate_logo_file()

### Community 96 - "Community 96"
Cohesion: 0.24
Nodes (5): Mokaid.Workspaces, create_workspace(), put_default_slug(), update_workspace(), upload_logo()

### Community 97 - "Community 97"
Cohesion: 0.31
Nodes (5): Mokaid.Assets3d, backfill_agent_avatar_ids(), default_character(), get_asset_by_slug(), seed_catalog()

### Community 98 - "Community 98"
Cohesion: 0.33
Nodes (6): Mokaid.Office, assign_idle_agents(), expire_finished(), maybe_fill_foosball(), pick_poi(), tick_workspace()

### Community 99 - "Community 99"
Cohesion: 0.44
Nodes (8): Mokaid.Release, load_app(), migrate(), provision_dev_user(), repos(), rollback(), seed(), seed_integration_logos()

### Community 100 - "Community 100"
Cohesion: 0.25
Nodes (3): MokaidWeb.AgentChatController, build_attachments(), create()

### Community 101 - "Community 101"
Cohesion: 0.28
Nodes (4): MokaidWeb.KnowledgeController, create(), presence(), upload()

### Community 102 - "Community 102"
Cohesion: 0.22
Nodes (8): description, exports, ./css, main, name, private, types, version

### Community 103 - "Community 103"
Cohesion: 0.22
Nodes (4): AgentStatusChangedPayload, PresenceMeta, TaskStatusChangedPayload, WorkspaceEvent

### Community 104 - "Community 104"
Cohesion: 0.25
Nodes (7): _as_vision_image_url(), _is_private_image_host(), True when OpenAI cannot fetch the URL (local MinIO, Docker, LAN)., Return a URL OpenAI Vision can fetch — data URL for private hosts., Vision URL rewriting: private MinIO hosts become data URLs., test_as_vision_image_url_from_bytes(), test_private_hosts_detected()

### Community 105 - "Community 105"
Cohesion: 0.29
Nodes (5): _handle_message(), Any, SQS consumer for production dispatch.  Phoenix publishes JSON messages with a `t, contains_2d(), main()

### Community 106 - "Community 106"
Cohesion: 0.43
Nodes (7): Mokaid.AI.Workers.AgentChatWorker, conversation(), current_tasks(), enrich_attachments(), member_name(), perform(), stale_trigger?()

### Community 107 - "Community 107"
Cohesion: 0.46
Nodes (8): MokaidWeb.PaymeWebhookController, amount_matches?(), callback(), card_info(), parse_amount(), payment_reference_matches?(), process(), seller_matches?()

### Community 109 - "Community 109"
Cohesion: 0.32
Nodes (7): DriveItem, DriveGridItemProps, DriveItemKind, DriveItemStatus, DriveItemSummary, DriveVisibility, KnowledgeItemSummary

### Community 110 - "Community 110"
Cohesion: 0.29
Nodes (7): LeaveRequest, LeaveRequestSummary, LeaveStatus, LeaveType, MemberSummary, ROLE_NAMES, RoleName

### Community 111 - "Community 111"
Cohesion: 0.36
Nodes (6): resolveWsUrl(), channels, disconnect(), getSocket(), joinChannel(), onSocketOpen()

### Community 112 - "Community 112"
Cohesion: 0.25
Nodes (7): description, exports, main, name, private, types, version

### Community 113 - "Community 113"
Cohesion: 0.50
Nodes (7): dump_camera(), dump_light(), dump_world(), main(), mat4_list(), Dump lights, camera, and world settings from office.blend to JSON.  Run:   blend, vec3()

### Community 114 - "Community 114"
Cohesion: 0.46
Nodes (7): bl_to_gltf(), collect_empties(), main(), mesh_world_bounds(), Vector, Dump walkable surfaces, obstacles, desk slots and named POIs from office.blend., Blender Z-up → glTF Y-up: (x, y, z) → (x, z, -y).

### Community 115 - "Community 115"
Cohesion: 0.38
Nodes (7): chat_json(), _extract_json(), _openai_compat_json(), Any, Parses a JSON object out of model text (tolerates code fences)., JSON-mode completion via any OpenAI-compatible API., Chat completion constrained to a JSON object response.      Always uses Anthropi

### Community 116 - "Community 116"
Cohesion: 0.43
Nodes (5): Mokaid.Accounts, authenticate_by_password(), register_user(), touch_login(), upsert_from_cognito()

### Community 117 - "Community 117"
Cohesion: 0.52
Nodes (7): Mokaid.Agents.Progression, apply_xp(), performance_score(), recent_memories(), record_completion(), snapshot(), xp_for_mission()

### Community 118 - "Community 118"
Cohesion: 0.57
Nodes (7): Mokaid.AI.Workers.DispatchWorker, agent_persona(), cleanup_failed_run(), colleagues(), dispatch(), perform(), skill_names()

### Community 119 - "Community 119"
Cohesion: 0.43
Nodes (6): Mokaid.Auth.Cognito, fetch_signing_key(), issuer(), jwks_url(), token_config(), verify_token()

### Community 120 - "Community 120"
Cohesion: 0.33
Nodes (4): Mokaid.Permissions, authorize(), can?(), Mokaid.PermissionsTest

### Community 121 - "Community 121"
Cohesion: 0.43
Nodes (5): Mokaid.Tasks.TaskExecutionRun, deep_scrub(), maybe_stamp(), progress_changeset(), scrub_null_bytes()

### Community 122 - "Community 122"
Cohesion: 0.43
Nodes (5): Mokaid.MixProject, aliases(), deps(), elixirc_paths(), project()

### Community 123 - "Community 123"
Cohesion: 0.40
Nodes (3): Mokaid.Accounts.User, maybe_hash_password(), registration_changeset()

### Community 124 - "Community 124"
Cohesion: 0.40
Nodes (3): MokaidWeb.AuthController, generate_slug(), register()

### Community 126 - "Community 126"
Cohesion: 0.47
Nodes (6): Mokaid.AICompletionTest, setup_run!(), Mokaid.Fixtures, owner_member(), user_fixture(), workspace_fixture()

### Community 127 - "Community 127"
Cohesion: 0.40
Nodes (4): converse(), Any, Conversational replies outside of runs.  When a teammate writes in a task thread, Generates the agent's chat reply and posts it as a task comment.

### Community 128 - "Community 128"
Cohesion: 0.60
Nodes (4): Mokaid.Drive.DriveItem, changeset(), put_slug(), validate_storage_key()

### Community 129 - "Community 129"
Cohesion: 0.70
Nodes (5): Mokaid.Knowledge.Workers.IngestionWorker, build_payload(), dispatch(), file_storage(), perform()

### Community 130 - "Community 130"
Cohesion: 0.50
Nodes (3): Mokaid.Members.LeaveRequest, changeset(), validate_date_order()

### Community 132 - "Community 132"
Cohesion: 0.50
Nodes (3): MokaidWeb.UserSocket, connect(), resolve_user()

### Community 134 - "Community 134"
Cohesion: 0.50
Nodes (3): MokaidWeb.FallbackController, call(), stringify()

### Community 135 - "Community 135"
Cohesion: 0.50
Nodes (3): MokaidWeb.Plugs.Authenticate, call(), resolve_user()

### Community 136 - "Community 136"
Cohesion: 0.40
Nodes (4): legacyAliases, missing, outDir, slugs

### Community 137 - "Community 137"
Cohesion: 0.40
Nodes (4): legacyAliases, missing, outDir, slugs

### Community 140 - "Community 140"
Cohesion: 0.60
Nodes (3): put_secret(), push-secrets-to-aws.sh script, update_stack_secret()

### Community 141 - "Community 141"
Cohesion: 0.67
Nodes (3): Mokaid.AgentChat.ChatMessage, changeset(), validate_body_or_attachments()

### Community 145 - "Community 145"
Cohesion: 0.67
Nodes (3): Mokaid.Billing.UsageEvent, changeset(), put_occurred_at()

### Community 146 - "Community 146"
Cohesion: 0.67
Nodes (3): Mokaid.Files, bucket(), create_from_upload()

### Community 148 - "Community 148"
Cohesion: 0.67
Nodes (3): Mokaid.Members.MemberInvite, changeset(), generate_token()

### Community 149 - "Community 149"
Cohesion: 0.67
Nodes (3): Mokaid.Tasks.Task, changeset(), maybe_set_completion()

### Community 165 - "Community 165"
Cohesion: 0.50
Nodes (3): files, manifest, outPath

### Community 200 - "Community 200"
Cohesion: 1.00
Nodes (3): Mokaid.Tasks.Workers.StaleRunWorker, fail_run(), perform()

### Community 273 - "Community 273"
Cohesion: 0.14
Nodes (19): useAgents(), useOnboardingSettings(), useTasks(), useUpdateOnboarding(), useUpdateWorkspace(), useWorkspace(), LogoMark(), OnboardingGate() (+11 more)

## Knowledge Gaps
- **370 isolated node(s):** `deploy-ecs-service.sh script`, `run-ecs-migration.sh script`, `mokaid-ai-worker`, `Mokaid.Repo`, `MokaidWeb.Endpoint` (+365 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **111 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 25` to `Community 231`, `Community 232`, `Community 233`, `Community 234`, `Community 235`, `Community 236`, `Community 237`, `Community 238`, `Community 239`, `Community 240`, `Community 81`, `Community 241`, `Community 242`, `Community 243`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `useSmoothScroll()` connect `Community 72` to `Community 233`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `lenis` connect `Community 233` to `Community 72`, `Community 25`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `deploy-ecs-service.sh script`, `run-ecs-migration.sh script`, `mokaid-ai-worker` to the rest of the system?**
  _370 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.052982456140350874 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0660377358490566 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06559356136820925 - nodes in this community are weakly interconnected._