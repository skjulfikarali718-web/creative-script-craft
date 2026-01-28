
# Unique Features Implementation Plan

This plan adds three powerful features that will differentiate ScriptGenie from ChatGPT and other generic AI tools: **Video Series Organization**, **Enhanced Collaboration**, and **YouTube Integration**.

---

## Overview

| Feature | What It Does | Competitive Advantage |
|---------|--------------|----------------------|
| Video Series | Organize scripts by projects/series | ChatGPT can't organize content by video projects |
| Collaboration | Real-time co-editing with version history | Built-in team workflow vs copy-pasting to docs |
| YouTube Integration | Connect account and publish metadata | Direct creator workflow integration |

---

## Feature 1: Video Series Organization

### What Users Get
- Create "Series" (e.g., "Tech Reviews 2024", "Cooking Show Season 1")
- Drag-and-drop scripts into series
- Episode numbering and ordering
- Series-level analytics (total views across all scripts)
- Filter saved scripts by series

### Database Changes

```sql
-- Create video_series table
CREATE TABLE video_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  color_theme TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add series_id and episode_number to scripts table
ALTER TABLE scripts 
ADD COLUMN series_id UUID REFERENCES video_series(id) ON DELETE SET NULL,
ADD COLUMN episode_number INTEGER;
```

### New Components
1. **SeriesManager.tsx** - Create, edit, delete series
2. **SeriesList.tsx** - Grid view of all series with script counts
3. **SeriesDetail.tsx** - View scripts in a series, reorder episodes
4. **SeriesSelector.tsx** - Dropdown to assign scripts to series

### UI Integration
- Add "Series" tab in navigation
- Add series filter in Saved Scripts page
- Show series badge on script cards
- Series selection when saving new scripts

---

## Feature 2: Enhanced Collaboration

### What Users Get
- Invite collaborators via email (with proper invitation system)
- View/Edit permission levels
- Version history with restore capability
- Real-time presence indicators
- Comment threads on specific script sections

### Database Changes

```sql
-- Script versions for history
CREATE TABLE script_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  change_summary TEXT
);

-- Collaboration invitations
CREATE TABLE collaboration_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view',
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days'
);

-- Inline comments on scripts
CREATE TABLE script_inline_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  selection_start INTEGER NOT NULL,
  selection_end INTEGER NOT NULL,
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### New Components
1. **CollaborationPanel.tsx** - Manage collaborators and send invites
2. **VersionHistory.tsx** - View and restore previous versions
3. **InlineComments.tsx** - Add comments to specific text selections
4. **PresenceIndicator.tsx** - Show who's currently viewing/editing

### Edge Functions
- **send-collaboration-invite**: Send email invitations
- **accept-invitation**: Join as collaborator via token

---

## Feature 3: YouTube Integration

### What Users Get
- Connect YouTube channel (OAuth)
- View channel analytics in ScriptGenie
- Export scripts directly to YouTube drafts (video description, tags)
- Sync published video performance back to ScriptGenie

### Implementation Approach

**Phase 1: YouTube Data Display**
- Connect YouTube account via OAuth
- Display channel stats (subscribers, views)
- Show recent videos with performance

**Phase 2: Export to YouTube**
- Generate video titles, descriptions, tags from script
- Create draft video with metadata (requires YouTube Data API)

### Database Changes

```sql
-- YouTube channel connections
CREATE TABLE youtube_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT now()
);

-- Track scripts exported to YouTube
CREATE TABLE youtube_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  video_id TEXT,
  export_type TEXT DEFAULT 'metadata',
  exported_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending'
);
```

### New Components
1. **YouTubeConnect.tsx** - OAuth connection flow
2. **YouTubeChannelStats.tsx** - Display channel overview
3. **YouTubeExport.tsx** - Export script to YouTube draft
4. **YouTubeSyncStatus.tsx** - Show sync status

### Edge Functions
- **youtube-oauth**: Handle OAuth callback
- **youtube-export**: Push metadata to YouTube
- **youtube-sync**: Fetch video performance

### Note on YouTube API
This requires a Google API key with YouTube Data API v3 enabled. Users will need to:
1. Connect their YouTube account via OAuth
2. ScriptGenie will store access/refresh tokens securely

---

## Implementation Priority

| Phase | Features | Effort |
|-------|----------|--------|
| **Phase 1** | Video Series Organization | 2-3 days |
| **Phase 2** | Enhanced Collaboration (Invites + Version History) | 3-4 days |
| **Phase 3** | YouTube Integration | 4-5 days |

---

## Technical Considerations

### Security
- All new tables will have RLS policies
- YouTube tokens stored encrypted
- Collaboration invites expire after 7 days
- Version history limited to last 50 versions per script

### Performance
- Series queries indexed on user_id
- Pagination for version history
- Lazy loading for collaboration features

### Mobile Support
- All new features will be mobile-responsive
- Touch-friendly series management
- Simplified collaboration UI on mobile

---

## Summary

These three features create a complete **content creation workflow** that ChatGPT simply cannot offer:

1. **Organization** - Manage content like a real production
2. **Collaboration** - Work with teams seamlessly
3. **Publishing** - Connect directly to where content goes live

This transforms ScriptGenie from "another AI writer" into a **complete creator studio**.
