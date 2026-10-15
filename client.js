window.__ModuleLoader__.load({
  id: "@shin/dsh-git-view",
  factory: (require) => {
    var module = { exports: {} };
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/entry.jsx
var entry_exports = {};
__export(entry_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(entry_exports);

// src/locales.js
var NS = "gitView";
var zh = {
  "view.git": "Git",
  "view.resize": "\u8C03\u6574\u6587\u4EF6\u5217\u8868\u5BBD\u5EA6",
  "projects.label": "\u9879\u76EE",
  "projects.clean": "\u5E72\u51C0",
  "projects.noCommits": "\u5C1A\u65E0\u63D0\u4EA4",
  "projects.reading": "\u8BFB\u53D6\u4E2D\u2026",
  "projects.quietCount": "{count} \u4E2A\u5E72\u51C0\u9879\u76EE",
  "projects.detached": "\u6E38\u79BB HEAD",
  // The three counts name the three groups above them, in the same words, so a
  // row and the section it summarises cannot be read as disagreeing. The
  // unstaged one used to read 已暂存 — "staged" — which said the opposite of
  // what it counted, on the row whose whole job is to say what is waiting.
  "projects.stagedCount": "\u5DF2\u6682\u5B58 {count}",
  "projects.unstagedCount": "\u672A\u6682\u5B58 {count}",
  "projects.untrackedCount": "\u672A\u8DDF\u8E2A {count}",
  "group.conflicts": "\u51B2\u7A81",
  "group.staged": "\u6682\u5B58\u7684\u66F4\u6539",
  "group.unstaged": "\u66F4\u6539",
  "empty.clean": "\u5DE5\u4F5C\u533A\u6CA1\u6709\u53D8\u66F4",
  "empty.select": "\u4ECE\u5DE6\u4FA7\u9009\u62E9\u4E00\u4E2A\u6587\u4EF6\u67E5\u770B\u5DEE\u5F02",
  "empty.notRepository": "\u8FD9\u4E2A\u76EE\u5F55\u4E0D\u5728 Git \u4ED3\u5E93\u91CC",
  "empty.gitUnavailable": "\u8FD9\u53F0\u673A\u5668\u4E0A\u6CA1\u6709\u53EF\u7528\u7684 git",
  "error.load": "\u8BFB\u53D6\u4ED3\u5E93\u72B6\u6001\u5931\u8D25",
  "action.refresh": "\u5237\u65B0",
  "mode.diff": "\u5DEE\u5F02",
  "mode.file": "\u6587\u4EF6",
  "action.copy": "\u590D\u5236",
  "action.copied": "\u5DF2\u590D\u5236",
  "action.footnotes": "\u811A\u6CE8",
  "layout.unified": "\u7EDF\u4E00",
  "layout.split": "\u5E76\u6392",
  "action.wrap": "\u6362\u884C",
  "status.binary": "\u4E8C\u8FDB\u5236\u6587\u4EF6",
  "status.oversized": "\u6587\u4EF6\u8FC7\u5927",
  "branch.detached": "\u5206\u79BB HEAD",
  "branch.ahead": "\u9886\u5148",
  "branch.behind": "\u843D\u540E",
  "branch.current": "\u5F53\u524D",
  "branch.new": "\u65B0\u5EFA\u5206\u652F\u2026",
  "branch.create": "\u521B\u5EFA",
  "branch.newPlaceholder": "\u5206\u652F\u540D\u79F0",
  "branch.remote": "\u8FDC\u7A0B\u5206\u652F",
  "action.stage": "\u6682\u5B58\u66F4\u6539",
  "action.unstage": "\u53D6\u6D88\u6682\u5B58",
  "action.discard": "\u4E22\u5F03\u66F4\u6539",
  "action.deleteFile": "\u4E22\u5F03\u6587\u4EF6",
  "action.restore": "\u8FD8\u539F",
  "action.more": "\u66F4\u591A\u64CD\u4F5C",
  "action.cancel": "\u53D6\u6D88",
  "action.close": "\u5173\u95ED",
  "action.confirm": "\u786E\u8BA4",
  "action.working": "\u6B63\u5728\u6267\u884C\u2026",
  "action.pulling": "\u6B63\u5728\u62C9\u53D6\u2026",
  "action.pulled": "\u5DF2\u62C9\u53D6",
  "action.syncing": "\u6B63\u5728\u540C\u6B65\u2026",
  "action.synced": "\u5DF2\u540C\u6B65",
  "action.committed": "\u5DF2\u63D0\u4EA4 \xB7 {project}",
  "commit.open": "\u63D0\u4EA4",
  "commit.submit": "\u63D0\u4EA4",
  "commit.generateShort": "\u751F\u6210",
  "commit.placeholder": "\u63D0\u4EA4\u4FE1\u606F",
  "tree.reading": "\u6B63\u5728\u8BFB\u53D6\u2026",
  "commit.nothingStagedHint": "\u6682\u5B58\u533A\u662F\u7A7A\u7684\uFF0C\u63D0\u4EA4\u548C\u751F\u6210\u90FD\u8981\u5148\u6709\u6682\u5B58\u7684\u6539\u52A8",
  "commit.expand": "\u653E\u5927\u8F93\u5165\u6846",
  "commit.collapse": "\u8FD8\u539F\u8F93\u5165\u6846",
  "push.title": "\u786E\u8BA4\u63A8\u9001",
  "push.summary": "\u5C06\u628A {n} \u4E2A\u63D0\u4EA4\u63A8\u9001\u5230 {target}",
  "push.nothingAhead": "{target} \u6CA1\u6709\u672C\u5730\u9886\u5148\u7684\u63D0\u4EA4",
  "push.unknown": "\u5C06\u63A8\u9001\u5230 {target}",
  "push.unknownBody": "\u8FD9\u4E2A\u63D0\u4EA4\u5217\u8868\u9700\u8981\u91CD\u542F\u4E00\u6B21\u5BBF\u4E3B\u624D\u4F1A\u51FA\u73B0\uFF1B\u5728\u6B64\u4E4B\u524D\u8BF7\u5148\u786E\u8BA4\u8981\u63A8\u9001\u7684\u5185\u5BB9\u3002",
  "push.working": "\u6B63\u5728\u63A8\u9001\u5230 {target}\u2026",
  "push.done": "\u5DF2\u63A8\u9001\u5230 {target}",
  "push.list": "\u5C06\u8981\u63A8\u9001\u7684\u63D0\u4EA4",
  "commit.generate": "\u7528\u6A21\u578B\u751F\u6210\u63D0\u4EA4\u4FE1\u606F",
  "commit.generating": "\u6B63\u5728\u751F\u6210\u2026",
  "group.stageAll": "\u5168\u90E8\u6682\u5B58",
  "group.unstageAll": "\u5168\u90E8\u53D6\u6D88\u6682\u5B58",
  "group.discardAll": "\u5168\u90E8\u4E22\u5F03",
  "repo.pull": "\u62C9\u53D6",
  "repo.push": "\u63A8\u9001",
  "repo.sync": "\u540C\u6B65",
  "repo.more": "\u4ED3\u5E93\u64CD\u4F5C",
  "remote.noRemote": "\u8FD9\u4E2A\u4ED3\u5E93\u6CA1\u6709\u914D\u7F6E\u8FDC\u7A0B",
  "remote.noUpstream": "\u5F53\u524D\u5206\u652F\u6CA1\u6709\u4E0A\u6E38\u5206\u652F",
  "commit.truncatedModel": "\u8FD9\u6761\u4FE1\u606F\u88AB\u6A21\u578B\u7684\u5B57\u6570\u4E0A\u9650\u622A\u65AD\u4E86\uFF0C\u8BF7\u68C0\u67E5\u672B\u53E5\u662F\u5426\u5B8C\u6574",
  "commit.truncatedDiff": "\u6682\u5B58\u5185\u5BB9\u592A\u5927\uFF0C\u6A21\u578B\u53EA\u770B\u5230\u5176\u4E2D\u4E00\u90E8\u5206\uFF0C\u4FE1\u606F\u53EF\u80FD\u4E0D\u5B8C\u6574",
  "commit.replaceTitle": "\u7528\u751F\u6210\u7684\u66FF\u6362\u5F53\u524D\u4FE1\u606F\uFF1F",
  "commit.replaceBody": "\u4F60\u5DF2\u7ECF\u5199\u4E86\u63D0\u4EA4\u4FE1\u606F\uFF0C\u91CD\u65B0\u751F\u6210\u4F1A\u628A\u5B83\u6574\u6BB5\u66FF\u6362\u6389\u3002",
  "commit.nothingStaged": "\u6CA1\u6709\u6682\u5B58\u5185\u5BB9\uFF0C\u65E0\u4ECE\u751F\u6210",
  "commit.generateTimeout": "\u751F\u6210\u8D85\u65F6\u4E86\uFF0860 \u79D2\uFF09\u3002\u6A21\u578B\u6CA1\u6709\u54CD\u5E94\uFF0C\u53EF\u4EE5\u624B\u52A8\u586B\u5199\u3002",
  "loading.status": "\u6B63\u5728\u8BFB\u53D6\u4ED3\u5E93\u72B6\u6001\u2026",
  "loading.diff": "\u6B63\u5728\u8BFB\u53D6\u6539\u52A8\u2026",
  "loading.file": "\u6B63\u5728\u8BFB\u53D6\u6587\u4EF6\u2026",
  "loading.refreshing": "\u6B63\u5728\u5237\u65B0\u2026",
  "diff.whole": "\u6574\u4E2A\u6587\u4EF6",
  "diff.changes": "\u53EA\u770B\u53D8\u52A8",
  "diff.removed": "\u6B64\u5904\u5220\u9664\u4E86 {n} \u884C",
  "refuse.staleRow": "\u8FD9\u4E2A\u6587\u4EF6\u5DF2\u7ECF\u4E0D\u5728\u8BE5\u884C\u6240\u8BF4\u7684\u72B6\u6001\u91CC\u4E86\uFF0C\u5237\u65B0\u540E\u518D\u8BD5\u3002",
  "refuse.newFile": "\u8FD9\u662F\u65B0\u6587\u4EF6\uFF0C\u8FD8\u6CA1\u6709\u53EF\u4EE5\u6BD4\u5BF9\u7684\u5DF2\u63D0\u4EA4\u7248\u672C\u3002",
  "refuse.pullFailed": "\u62C9\u53D6\u5931\u8D25\u3002",
  "refuse.pushFailed": "\u63A8\u9001\u5931\u8D25\u3002",
  "preview.hoverLoading": "\u8BFB\u53D6\u5DEE\u5F02\u2026",
  "preview.hoverEmpty": "\u8FD9\u4E2A\u6587\u4EF6\u6CA1\u6709\u6587\u672C\u5DEE\u5F02",
  "preview.hoverFailed": "\u65E0\u6CD5\u8BFB\u53D6\u5DEE\u5F02",
  "preview.hoverMore": "\u8FD8\u6709 {n} \u884C\uFF0C\u70B9\u51FB\u67E5\u770B\u5168\u90E8",
  "preview.noTextDiff": "\u65E0\u6587\u672C\u5DEE\u5F02",
  "selection.count": "\u5DF2\u9009 {n} \u9879",
  "selection.checkTitle": "\u9009\u4E2D\u4EE5\u6279\u91CF\u6682\u5B58",
  "selection.stage": "\u6682\u5B58\u6240\u9009",
  "selection.unstage": "\u53D6\u6D88\u6682\u5B58\u6240\u9009",
  "selection.discard": "\u4E22\u5F03\u6240\u9009",
  "selection.delete": "\u5220\u9664\u6240\u9009",
  "common.cancel": "\u53D6\u6D88",
  "repo.bulk": "\u6279\u91CF\u64CD\u4F5C",
  "repo.stageAll": "\u6682\u5B58\u5168\u90E8\u66F4\u6539 ({n})",
  "repo.unstageAll": "\u53D6\u6D88\u6682\u5B58\u5168\u90E8 ({n})",
  "repo.discardAll": "\u4E22\u5F03\u5168\u90E8\u66F4\u6539 ({n})",
  "repo.discardUntracked": "\u5220\u9664\u5168\u90E8\u672A\u8DDF\u8E2A ({n})",
  "mode.edit": "\u7F16\u8F91",
  "edit.save": "\u4FDD\u5B58",
  "edit.saving": "\u4FDD\u5B58\u4E2D\u2026",
  "edit.saved": "\u5DF2\u4FDD\u5B58",
  "edit.dirty": "\u672A\u4FDD\u5B58\u7684\u66F4\u6539",
  "edit.clean": "\u6CA1\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539",
  "edit.hint": "Ctrl+S \u4FDD\u5B58",
  "edit.unavailable": "\u53EA\u80FD\u7F16\u8F91\u5DE5\u4F5C\u533A\u4E2D\u7684\u6587\u4EF6",
  "preview.noDocument": "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u4E0D\u80FD\u5185\u5D4C\u663E\u793A\u8BE5\u6587\u6863",
  "preview.download": "\u4E0B\u8F7D\u67E5\u770B",
  "stash.title": "\u8D2E\u85CF",
  "stash.empty": "\u6CA1\u6709\u8D2E\u85CF",
  "stash.list": "\u8D2E\u85CF\u5217\u8868",
  "stash.push": "\u8D2E\u85CF\u5168\u90E8\u66F4\u6539",
  "stash.files": "{n} \u4E2A\u6587\u4EF6",
  "stash.drop": "\u5220\u9664\u6B64\u8D2E\u85CF",
  "stash.clear": "\u5220\u9664\u5168\u90E8\u8D2E\u85CF",
  "risk.acknowledge": "\u6211\u4E86\u89E3\u8FD9\u4E2A\u64CD\u4F5C\u65E0\u6CD5\u64A4\u9500",
  "risk.discardTitle": "\u4E22\u5F03\u66F4\u6539",
  "risk.discardBody": "{path} \u7684\u4FEE\u6539\u5C06\u88AB\u6C38\u4E45\u4E22\u5F03\uFF0C\u65E0\u6CD5\u901A\u8FC7\u63D0\u4EA4\u6062\u590D\u3002",
  "risk.deleteTitle": "\u5220\u9664\u6587\u4EF6",
  "risk.deleteBody": "{path} \u5C06\u4ECE\u78C1\u76D8\u5220\u9664\uFF0C\u65E0\u6CD5\u6062\u590D\u3002",
  "risk.restoreTitle": "\u8FD8\u539F\u66F4\u6539",
  "risk.restoreBody": "{path} \u7684\u6682\u5B58\u5185\u5BB9\u5C06\u8986\u76D6\u5DE5\u4F5C\u533A\u4E2D\u7684\u4FEE\u6539\uFF0C\u65E0\u6CD5\u6062\u590D\u3002",
  "risk.dropTitle": "\u5220\u9664\u8D2E\u85CF",
  "risk.dropBody": "{entry} \u662F\u8FD9\u4EFD\u5DE5\u4F5C\u7684\u6700\u540E\u4E00\u4EFD\u526F\u672C\uFF0C\u5220\u9664\u540E\u65E0\u6CD5\u6062\u590D\u3002",
  "risk.clearTitle": "\u5220\u9664\u5168\u90E8\u8D2E\u85CF",
  "risk.clearBody": "\u6240\u6709\u8D2E\u85CF\u90FD\u4F1A\u88AB\u5220\u9664\uFF0C\u65E0\u6CD5\u6062\u590D\u3002",
  "risk.discardAllTitle": "\u4E22\u5F03\u5168\u90E8\u66F4\u6539",
  "risk.discardAllBody": "\u8FD9 {n} \u4E2A\u6587\u4EF6\u7684\u4FEE\u6539\u5C06\u88AB\u6C38\u4E45\u4E22\u5F03\uFF0C\u65E0\u6CD5\u901A\u8FC7\u63D0\u4EA4\u6062\u590D\u3002",
  "risk.deleteAllTitle": "\u5220\u9664\u5168\u90E8\u6587\u4EF6",
  "risk.deleteAllBody": "\u8FD9 {n} \u4E2A\u6587\u4EF6\u5C06\u4ECE\u78C1\u76D8\u5220\u9664\uFF0C\u65E0\u6CD5\u6062\u590D\u3002"
};
var en = {
  "view.git": "Git",
  "view.resize": "\u8C03\u6574\u6587\u4EF6\u5217\u8868\u5BBD\u5EA6",
  "projects.label": "Projects",
  "projects.clean": "Clean",
  "projects.noCommits": "No commits yet",
  "projects.reading": "Reading\u2026",
  "projects.quietCount": "{count} clean projects",
  "projects.detached": "Detached HEAD",
  "projects.stagedCount": "{count} staged",
  "projects.unstagedCount": "{count} unstaged",
  "projects.untrackedCount": "{count} untracked",
  "group.conflicts": "Conflicts",
  "group.staged": "Staged Changes",
  "group.unstaged": "Changes",
  "empty.clean": "No changes",
  "empty.select": "Select a file on the left to see its diff",
  "empty.notRepository": "This directory is not a Git repository",
  "empty.gitUnavailable": "No usable git on this machine",
  "error.load": "Could not read the repository status",
  "action.refresh": "Refresh",
  "mode.diff": "Diff",
  "mode.file": "File",
  "action.copy": "Copy",
  "action.copied": "Copied",
  "action.footnotes": "Footnotes",
  "layout.unified": "Unified",
  "layout.split": "Split",
  "action.wrap": "Wrap",
  "status.binary": "Binary file",
  "status.oversized": "File too large",
  "branch.detached": "Detached HEAD",
  "branch.ahead": "ahead",
  "branch.behind": "behind",
  "branch.current": "current",
  "branch.new": "Create branch\u2026",
  "branch.create": "Create",
  "branch.newPlaceholder": "Branch name",
  "branch.remote": "Remote branches",
  "action.stage": "Stage Change",
  "action.unstage": "Unstage Change",
  "action.discard": "Discard Change",
  "action.deleteFile": "Discard File",
  "action.restore": "Restore",
  "action.more": "More actions",
  "action.cancel": "Cancel",
  "action.close": "Close",
  "action.confirm": "Confirm",
  "action.working": "Working\u2026",
  "action.pulling": "Pulling\u2026",
  "action.pulled": "Pulled",
  "action.syncing": "Syncing\u2026",
  "action.synced": "Synced",
  "action.committed": "Committed in {project}",
  "commit.open": "Commit",
  "commit.submit": "Commit",
  "commit.generateShort": "Generate",
  "commit.placeholder": "Message",
  "tree.reading": "Reading\u2026",
  "commit.nothingStagedHint": "Nothing is staged; commit and generate both need staged changes",
  "commit.expand": "Enlarge the message box",
  "commit.collapse": "Restore the message box",
  "push.title": "Confirm push",
  "push.summary": "Push {n} commit(s) to {target}",
  "push.nothingAhead": "{target} has no commits the local branch is ahead by",
  "push.unknown": "Push to {target}",
  "push.unknownBody": "This commit list needs one host restart to appear; check what you are pushing until then.",
  "push.working": "Pushing to {target}\u2026",
  "push.done": "Pushed to {target}",
  "push.list": "Commits about to be pushed",
  "commit.generate": "Write the message with the configured model",
  "commit.generating": "Writing\u2026",
  "group.stageAll": "Stage all",
  "group.unstageAll": "Unstage all",
  "group.discardAll": "Discard all",
  "repo.pull": "Pull",
  "repo.push": "Push",
  "repo.sync": "Sync",
  "repo.more": "Repository actions",
  "remote.noRemote": "This repository has no remote configured",
  "remote.noUpstream": "This branch has no upstream",
  "commit.truncatedModel": "The message hit the model\u2019s length limit \u2014 check whether the last sentence ends cleanly",
  "commit.truncatedDiff": "The staged change is large enough that the model only saw part of it, so the message may be incomplete",
  "commit.replaceTitle": "Replace the current message?",
  "commit.replaceBody": "You already wrote a commit message. Generating again replaces all of it.",
  "commit.nothingStaged": "Nothing is staged, so there is nothing to describe",
  "commit.generateTimeout": "Generation timed out after 60s. The model did not answer; you can write the message yourself.",
  "loading.status": "Reading repository status\u2026",
  "loading.diff": "Reading the change\u2026",
  "loading.file": "Reading the file\u2026",
  "loading.refreshing": "Refreshing\u2026",
  "diff.whole": "Whole file",
  "diff.changes": "Changes only",
  "diff.removed": "{n} lines removed here",
  "refuse.staleRow": "That file is no longer in the state this row described. Refresh and try again.",
  "refuse.newFile": "This file is new, so there is no committed version of it to compare against.",
  "refuse.pullFailed": "Pull failed.",
  "refuse.pushFailed": "Push failed.",
  "preview.hoverLoading": "Reading the diff\u2026",
  "preview.hoverEmpty": "This file has no text diff",
  "preview.hoverFailed": "The diff could not be read",
  "preview.hoverMore": "{n} more lines \u2014 click to see them all",
  "preview.noTextDiff": "No text diff",
  "selection.count": "{n} selected",
  "selection.checkTitle": "Select for a bulk action",
  "selection.stage": "Stage selected",
  "selection.unstage": "Unstage selected",
  "selection.discard": "Discard selected",
  "selection.delete": "Delete selected",
  "common.cancel": "Cancel",
  "repo.bulk": "Bulk actions",
  "repo.stageAll": "Stage all changes ({n})",
  "repo.unstageAll": "Unstage all ({n})",
  "repo.discardAll": "Discard all changes ({n})",
  "repo.discardUntracked": "Delete all untracked ({n})",
  "mode.edit": "Edit",
  "edit.save": "Save",
  "edit.saving": "Saving\u2026",
  "edit.saved": "Saved",
  "edit.dirty": "Unsaved changes",
  "edit.clean": "No unsaved changes",
  "edit.hint": "Ctrl+S to save",
  "edit.unavailable": "Only working-tree files can be edited",
  "preview.noDocument": "This browser cannot show the document inline",
  "preview.download": "Download to view",
  "stash.title": "Stashes",
  "stash.empty": "No stashes",
  "stash.list": "Stash list",
  "stash.push": "Stash all changes",
  "stash.files": "{n} files",
  "stash.drop": "Drop this stash",
  "stash.clear": "Clear all stashes",
  "risk.acknowledge": "I understand this cannot be undone",
  "risk.discardTitle": "Discard change",
  "risk.discardBody": "Changes to {path} will be lost for good; no commit can bring them back.",
  "risk.deleteTitle": "Delete file",
  "risk.deleteBody": "{path} will be deleted from disk and cannot be recovered.",
  "risk.restoreTitle": "Restore change",
  "risk.restoreBody": "The staged copy of {path} will overwrite your working copy, which cannot be recovered.",
  "risk.dropTitle": "Drop stash",
  "risk.dropBody": "{entry} is the only remaining copy of that work; dropping it cannot be undone.",
  "risk.clearTitle": "Clear all stashes",
  "risk.clearBody": "Every stash will be dropped. This cannot be undone.",
  "risk.discardAllTitle": "Discard all changes",
  "risk.discardAllBody": "Changes to these {n} files will be lost for good; no commit can bring them back.",
  "risk.deleteAllTitle": "Delete all files",
  "risk.deleteAllBody": "These {n} files will be deleted from disk and cannot be recovered."
};

// src/i18n.js
var translate = (key) => key;
function bindLocale(ctx) {
  translate = ctx.locale.bind(NS);
}
function t(key, values) {
  const text = translate(key);
  if (values === void 0) return text;
  return Object.entries(values).reduce(
    (out, [name, value]) => out.split(`{${name}}`).join(String(value)),
    text
  );
}
function tOr(key, fallback) {
  const text = translate(key);
  return text === key ? fallback : text;
}

// src/view.jsx
var import_react7 = require("react");
var import_dsh_client_ui_primitives4 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/actions.jsx
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react2 = require("react");

// src/api.js
var NO_STORE = { cache: "no-store" };
var scope = (sessionId, repo) => repo === void 0 ? { sessionId } : { sessionId, repo };
async function get(path, params, signal) {
  const query = new URLSearchParams(params);
  const response = await fetch(`${path}?${query}`, { ...NO_STORE, signal });
  const text = await response.text();
  if (!response.ok) throw new GitError(text || `${response.status}`, response.status);
  try {
    return JSON.parse(text);
  } catch {
    throw new GitError(text, response.status);
  }
}
var GitError = class extends Error {
  /**
   * @param {string} message - git's own message, or the status text.
   * @param {number} status - HTTP status.
   */
  constructor(message, status) {
    super(message);
    this.name = "GitError";
    this.status = status;
  }
};
var readStatus = (sessionId, repo, signal) => get("/api/git.status", scope(sessionId, repo), signal);
var readRepositories = (sessionId, fresh, signal) => get("/api/git.repositories", fresh ? { sessionId, fresh: "1" } : { sessionId }, signal);
var readSummaries = (sessionId, signal) => get("/api/git.summaries", { sessionId }, signal);
var readDiff = (sessionId, path, side, repo, signal) => get("/api/git.diff", { ...scope(sessionId, repo), path, side }, signal);
var readUntracked = (sessionId, dir, repo, signal) => get("/api/git.untracked", { ...scope(sessionId, repo), dir }, signal);
var readFile = (sessionId, path, side, repo, signal) => get("/api/git.file", { ...scope(sessionId, repo), path, side }, signal);
async function writeFile(sessionId, path, content, version, repo) {
  const response = await fetch(`/api/git.write?${new URLSearchParams(scope(sessionId, repo))}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    ...NO_STORE,
    body: JSON.stringify({ path, text: content, ...version === void 0 ? {} : { version } })
  });
  const text = await response.text();
  if (!response.ok) throw new GitError(text || `${response.status}`, response.status);
  try {
    return JSON.parse(text);
  } catch {
    return { ok: true };
  }
}
var readBranches = (sessionId, repo, signal) => get("/api/git.branches", scope(sessionId, repo), signal);
var readStashes = (sessionId, repo, signal) => get("/api/git.stashes", scope(sessionId, repo), signal);
async function postAction(sessionId, body, repo, signal) {
  const response = await fetch(`/api/git.action?${new URLSearchParams(scope(sessionId, repo))}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    ...NO_STORE,
    ...signal === void 0 ? {} : { signal },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  if (!response.ok) throw new GitError(...refusal(text, response.status));
  try {
    return JSON.parse(text);
  } catch {
    return { ok: true };
  }
}
function refusal(text, status) {
  try {
    const parsed = JSON.parse(text);
    const known = typeof parsed?.code === "string" ? tOr(`refuse.${parsed.code}`, void 0) : void 0;
    const message = known ?? (typeof parsed?.message === "string" ? parsed.message : void 0);
    if (message !== void 0) {
      return [parsed.detail === void 0 || parsed.detail === "" ? message : `${message}
${parsed.detail}`, status];
    }
  } catch {
  }
  return [text || `${status}`, status];
}

// src/projects.jsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function projectCount(entry) {
  const ready = entry.staged + entry.conflicts;
  if (ready > 0) return t("projects.stagedCount", { count: ready });
  if (entry.unstaged > 0) return t("projects.unstagedCount", { count: entry.unstaged });
  return t("projects.untrackedCount", { count: entry.untracked });
}
function projectBranch(entry) {
  if (entry.unborn === true) return t("projects.noCommits");
  if (entry.branch === null || entry.branch === void 0) return t("projects.detached");
  return entry.branch;
}
function Dot({ state }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `gv-project-dot ${state}`, "aria-hidden": "true" });
}
function ProjectRow({ entry, summary, current, onSelect }) {
  const pending = summary === void 0;
  const state = pending ? "pending" : summary.conflicts > 0 ? "conflict" : summary.clean ? "clean" : summary.staged > 0 ? "ready" : "changed";
  const count = pending ? t("projects.reading") : summary.clean ? t("projects.clean") : projectCount(summary);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "button",
    {
      type: "button",
      className: `gv-project${current ? " current" : ""}`,
      "aria-current": current,
      title: entry.path,
      onClick: () => onSelect(entry.path),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dot, { state }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "gv-project-name", children: entry.name }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "gv-project-branch", children: pending ? "" : projectBranch(summary) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "gv-project-count", children: count })
      ]
    }
  );
}
function ProjectLayer({ projects, summaries, current, onSelect }) {
  const [showQuiet, setShowQuiet] = (0, import_react.useState)(false);
  if (projects === void 0 || projects.length < 2) return null;
  const states = new Map((summaries ?? []).map((entry) => [entry.path, entry]));
  const busy = [];
  const quiet = [];
  for (const entry of projects) {
    const summary = states.get(entry.path);
    if (summary === void 0 || !summary.clean) busy.push(entry);
    else quiet.push(entry);
  }
  const shownQuiet = quiet.filter((entry) => showQuiet || entry.path === current);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "gv-projects", role: "group", "aria-label": t("projects.label"), children: [
    busy.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ProjectRow,
      {
        entry,
        summary: states.get(entry.path),
        current: entry.path === current,
        onSelect
      },
      entry.path
    )),
    shownQuiet.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ProjectRow,
      {
        entry,
        summary: states.get(entry.path),
        current: entry.path === current,
        onSelect
      },
      entry.path
    )),
    quiet.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        type: "button",
        className: "gv-project-quiet",
        "aria-expanded": showQuiet,
        onClick: () => setShowQuiet((value) => !value),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "gv-project-caret", "aria-hidden": "true", children: showQuiet ? "\u25BE" : "\u25B8" }),
          t("projects.quietCount", { count: quiet.length })
        ]
      }
    )
  ] });
}

// src/actions.jsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var GENERATE_TIMEOUT_MS = 6e4;
var WORKING_AFTER_MS = 400;
var DONE_FOR_MS = 6e3;
function useActions(sessionId, refresh, repo) {
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [generating, setGenerating] = (0, import_react2.useState)(false);
  const [problem, setProblem] = (0, import_react2.useState)(void 0);
  const [working, setWorking] = (0, import_react2.useState)(void 0);
  const [done, setDone] = (0, import_react2.useState)(void 0);
  const [gate, setGate] = (0, import_react2.useState)(void 0);
  (0, import_react2.useEffect)(() => {
    if (done === void 0) return void 0;
    const timer = setTimeout(() => setDone(void 0), DONE_FOR_MS);
    return () => clearTimeout(timer);
  }, [done]);
  const run = (0, import_react2.useCallback)(
    async (body, describe = {}) => {
      setBusy(true);
      setProblem(void 0);
      setDone(void 0);
      setWorking(void 0);
      const slow = setTimeout(() => setWorking(describe.working ?? t("action.working")), WORKING_AFTER_MS);
      try {
        const answer = await postAction(sessionId, body, repo);
        await refresh();
        if (describe.done !== void 0) {
          setDone(typeof describe.done === "function" ? describe.done(answer) : describe.done);
        }
        return answer;
      } catch (error) {
        setProblem(error.message);
        return void 0;
      } finally {
        clearTimeout(slow);
        setWorking(void 0);
        setBusy(false);
      }
    },
    [sessionId, refresh, repo]
  );
  const confirm = (0, import_react2.useCallback)((title, description, body) => setGate({ title, description, body }), []);
  const generateMessage = (0, import_react2.useCallback)(async () => {
    setGenerating(true);
    setProblem(void 0);
    try {
      const answer = await postAction(
        sessionId,
        { action: "generateMessage" },
        repo,
        AbortSignal.timeout(GENERATE_TIMEOUT_MS)
      );
      if (answer?.truncated === true) setProblem(t("commit.truncatedModel"));
      else if (answer?.diffTruncated === true) setProblem(t("commit.truncatedDiff"));
      return answer?.message;
    } catch (error) {
      setProblem(
        error?.name === "TimeoutError" || error?.name === "AbortError" ? t("commit.generateTimeout") : error.message
      );
      return void 0;
    } finally {
      setGenerating(false);
    }
  }, [sessionId]);
  return {
    run,
    confirm,
    generateMessage,
    gate,
    busy,
    generating,
    problem,
    working,
    done,
    dismiss: () => setGate(void 0)
  };
}
function RiskGate({ gate, onDismiss, run }) {
  const [acknowledged, setAcknowledged] = (0, import_react2.useState)(false);
  if (gate === void 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    import_dsh_client_ui_primitives.RiskConfirmation,
    {
      open: true,
      title: gate.title,
      description: gate.description,
      acknowledgeLabel: t("risk.acknowledge"),
      cancelLabel: t("action.cancel"),
      closeLabel: t("action.close"),
      confirmLabel: t("action.confirm"),
      acknowledged,
      onAcknowledgedChange: setAcknowledged,
      onCancel: () => {
        setAcknowledged(false);
        onDismiss();
      },
      onConfirm: () => {
        setAcknowledged(false);
        onDismiss();
        if (typeof gate.body === "function") gate.body();
        else run(gate.body);
      }
    }
  );
}
function CommitBar({ staged, busy, generating, problem, working, done, run, generateMessage, confirmGenerate, confirmPush, repo, projectName, projects, summaries, currentProject, onSelectProject }) {
  const [drafts, setDrafts] = (0, import_react2.useState)(() => /* @__PURE__ */ new Map());
  const key = currentProject ?? "";
  const message = drafts.get(key) ?? "";
  const setMessage = (value) => setDrafts((current) => {
    const next = new Map(current);
    next.set(key, value);
    return next;
  });
  const [wide, setWide] = (0, import_react2.useState)(false);
  const idle = !busy && !generating;
  const committable = idle && staged.length > 0 && message.trim() !== "";
  const noRemote = repo?.hasRemote === false;
  const submit = () => {
    if (!committable) return;
    setMessage("");
    run(
      { action: "commit", message: message.trim() },
      { done: t("action.committed", { project: projectName ?? "" }) }
    );
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ProjectLayer, { projects, summaries, current: currentProject, onSelect: onSelectProject }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `gv-commit${wide ? " is-open" : ""}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "gv-commit-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "textarea",
          {
            id: "gv-commit-message",
            className: "gv-input gv-textarea",
            value: message,
            rows: 2,
            disabled: !idle,
            placeholder: t("commit.placeholder"),
            "aria-label": t("commit.placeholder"),
            "aria-expanded": wide,
            onChange: (event) => setMessage(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                submit();
              }
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            className: "gv-btn icon gv-commit-expand",
            title: wide ? t("commit.collapse") : t("commit.expand"),
            "aria-label": wide ? t("commit.collapse") : t("commit.expand"),
            "aria-expanded": wide,
            "aria-controls": "gv-commit-message",
            onClick: () => setWide((value) => !value),
            children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: wide ? "\u2304" : "\u2303" })
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "gv-commit-bar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "button",
          {
            type: "button",
            className: "gv-btn",
            title: staged.length === 0 ? t("commit.nothingStaged") : generating ? t("commit.generating") : t("commit.generate"),
            "aria-label": t("commit.generate"),
            "aria-busy": generating,
            disabled: !idle || staged.length === 0,
            onClick: async () => {
              const generated = await (message.trim() === "" ? generateMessage() : confirmGenerate(generateMessage));
              if (typeof generated === "string") setMessage(generated);
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: generating ? "\u2026" : "\u2728" }),
              " ",
              t("commit.generateShort")
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "button",
          {
            type: "button",
            className: "gv-btn primary gv-commit-go",
            title: staged.length === 0 ? t("commit.nothingStaged") : t("commit.submit"),
            disabled: !committable,
            onClick: submit,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: "\u2713" }),
              " ",
              projectName === void 0 ? t("commit.submit") : `${t("commit.submit")} \xB7 ${projectName}`
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "button",
          {
            type: "button",
            className: "gv-btn gv-commit-push",
            title: noRemote ? t("remote.noRemote") : t("repo.push"),
            "aria-label": t("repo.push"),
            disabled: busy || noRemote,
            onClick: () => confirmPush(),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: "\u2191" }),
              " ",
              t("repo.push")
            ]
          }
        )
      ] }),
      staged.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "gv-commit-hint", children: t("commit.nothingStagedHint") }) : null,
      generating || working !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "gv-commit-note", role: "status", children: generating ? t("commit.generating") : working }) : problem !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "gv-commit-note error", role: "alert", children: problem }) : done !== void 0 ? (
        // A push leaves nothing behind in the panel: the commits are gone from
        // the branch and the ahead count drops to zero, which looks exactly like
        // never having pushed. So the one action with no other evidence says so.
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "gv-commit-note done", role: "status", children: done })
      ) : null
    ] })
  ] });
}
function PushGate({ gate, onClose, onConfirm }) {
  if (gate === void 0) return null;
  const { repo } = gate;
  const target = repo?.upstream ?? t("repo.push");
  const measured = Array.isArray(repo?.outgoing);
  const outgoing = measured ? repo.outgoing : [];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    import_dsh_client_ui_primitives.Modal,
    {
      open: true,
      onClose,
      closeLabel: t("action.close"),
      title: t("push.title"),
      description: measured ? t("push.summary", { n: outgoing.length, target }) : t("push.unknown", { target }),
      className: "gv-push-modal",
      contentClassName: "gv-push-list",
      footer: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "gv-btn", onClick: onClose, children: t("action.cancel") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "gv-btn primary", "data-modal-autofocus": true, onClick: onConfirm, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: "\u2191" }),
          " ",
          t("repo.push")
        ] })
      ] }),
      children: !measured ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "gv-push-empty", children: t("push.unknownBody") }) : outgoing.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "gv-push-empty", children: t("push.nothingAhead", { target }) }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: "gv-push-commits", "aria-label": t("push.list"), children: outgoing.map((commit) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: "gv-push-commit", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "gv-push-sha", children: commit.sha }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "gv-push-subject", children: commit.subject })
      ] }, commit.sha)) })
    }
  );
}
function RowActions({ file, side, run, confirm }) {
  const [open, setOpen] = (0, import_react2.useState)(false);
  const close = () => setOpen(false);
  const staged = side === "staged";
  const items = staged ? [
    { id: "unstage", label: t("action.unstage") },
    { id: "restore", label: t("action.restore"), danger: true }
  ] : [
    { id: "stage", label: t("action.stage") },
    {
      id: "discard",
      label: side === "untracked" ? t("action.deleteFile") : t("action.discard"),
      danger: true
    }
  ];
  const toggle = staged ? { action: "unstage", paths: [file.path] } : { action: "stage", paths: [file.path] };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "gv-row-actions", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        className: "gv-quick",
        title: staged ? t("action.unstage") : t("action.stage"),
        "aria-label": staged ? t("action.unstage") : t("action.stage"),
        onClick: (event) => {
          event.stopPropagation();
          run(toggle);
        },
        children: staged ? "\u2212" : "+"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      import_dsh_client_ui_primitives.Menu,
      {
        open,
        align: "end",
        dense: true,
        portal: true,
        anchor: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            className: "gv-more",
            "aria-label": t("action.more"),
            "aria-expanded": open,
            onClick: (event) => {
              event.stopPropagation();
              setOpen((value) => !value);
            },
            children: "\u22EF"
          }
        ),
        items,
        onSelect: (id) => {
          close();
          if (id === "stage") run({ action: "stage", paths: [file.path] });
          else if (id === "unstage") run({ action: "unstage", paths: [file.path] });
          else if (id === "discard") {
            confirm(
              side === "untracked" ? t("risk.deleteTitle") : t("risk.discardTitle"),
              t("risk.discardBody").replace("{path}", file.path),
              { action: "discard", path: file.path, side }
            );
          } else if (id === "restore") {
            confirm(t("risk.restoreTitle"), t("risk.restoreBody").replace("{path}", file.path), {
              action: "restore",
              path: file.path,
              side
            });
          }
        },
        onClose: close
      }
    )
  ] });
}
function SelectionBar({ files, run, confirm }) {
  if (files.length === 0) return null;
  const paths = files.map((file) => file.path);
  const bySide = (side) => files.filter((file) => file.side === side).map((file) => file.path);
  const staged = bySide("staged");
  const unstaged = bySide("unstaged");
  const untracked = bySide("untracked");
  const discardable = unstaged.length + untracked.length;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "gv-selection", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "gv-selection-count", children: t("selection.count", { n: files.length }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        className: "gv-btn",
        onClick: () => run({ action: "stage", paths }),
        children: t("selection.stage")
      }
    ),
    staged.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "gv-btn", onClick: () => run({ action: "unstage", paths: staged }), children: t("selection.unstage") }),
    discardable === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        className: "gv-btn",
        onClick: () => {
          const title = untracked.length > 0 ? t("risk.deleteTitle") : t("risk.discardTitle");
          const body = t(untracked.length > 0 ? "risk.deleteBody" : "risk.discardBody", { n: discardable });
          confirm(title, body, async () => {
            if (unstaged.length > 0) await run({ action: "discard", side: "unstaged", paths: unstaged });
            if (untracked.length > 0) await run({ action: "discard", side: "untracked", paths: untracked });
          });
        },
        children: untracked.length > 0 ? t("selection.delete") : t("selection.discard")
      }
    )
  ] });
}
function DirActions({ side, files, paths, run, confirm }) {
  if (paths.length === 0) return null;
  const staged = side === "staged";
  const kinds = new Set((files ?? []).map((file) => file.status === "?" ? "untracked" : "unstaged"));
  const untracked = staged || kinds.size !== 1 ? false : kinds.has("untracked");
  const mixed = kinds.size > 1;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "gv-row-actions", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        className: "gv-quick",
        title: staged ? t("group.unstageAll") : t("group.stageAll"),
        "aria-label": staged ? t("group.unstageAll") : t("group.stageAll"),
        onClick: (event) => {
          event.stopPropagation();
          run(staged ? { action: "unstage", paths } : { action: "stage", paths });
        },
        children: staged ? "\u2212" : "+"
      }
    ),
    staged || mixed ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        className: "gv-quick",
        title: untracked ? t("risk.deleteAllTitle") : t("group.discardAll"),
        "aria-label": untracked ? t("risk.deleteAllTitle") : t("group.discardAll"),
        onClick: (event) => {
          event.stopPropagation();
          confirm(
            untracked ? t("risk.deleteAllTitle") : t("risk.discardAllTitle"),
            t(untracked ? "risk.deleteAllBody" : "risk.discardAllBody", { n: paths.length }),
            { action: "discard", side: untracked ? "untracked" : "unstaged", paths }
          );
        },
        children: "\u2298"
      }
    )
  ] });
}
function GroupActions({ side, files, paths, run, confirm }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DirActions, { side, files, paths, run, confirm });
}

// src/skeleton.jsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function Bar({ width, className = "" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: `gv-sk-bar ${className}`, style: { width } });
}
function TreeSkeleton() {
  const rows = [
    { indent: 0, name: 34 },
    { indent: 12, name: 52, counts: true },
    { indent: 24, name: 78, counts: true },
    { indent: 24, name: 61, counts: true },
    { indent: 0, name: 28 },
    { indent: 12, name: 70, counts: true }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "gv-sk", "aria-hidden": "true", children: [0, 1].map((group) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "gv-sk-group", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "gv-sk-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Bar, { width: "58px" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Bar, { width: "14px" })
    ] }),
    rows.slice(group * 3, group * 3 + 3).map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "gv-sk-row", style: { paddingLeft: 8 + row.indent }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Bar, { width: "10px", className: "gv-sk-mono" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Bar, { width: `${row.name}px` }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "gv-sk-spacer" }),
      row.counts ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Bar, { width: "18px", className: "gv-sk-mono" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Bar, { width: "18px", className: "gv-sk-mono" })
      ] }) : null
    ] }, index))
  ] }, group)) });
}
function DiffSkeleton() {
  const widths = ["62%", "38%", "74%", "55%", "44%", "68%", "31%", "57%"];
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "gv-sk", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "gv-sk-hunk", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Bar, { width: "150px", className: "gv-sk-mono" }) }),
    widths.map((width, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: `gv-sk-line${index < 3 ? "" : index < 5 ? " add" : " del"}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Bar, { width: "22px", className: "gv-sk-mono" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Bar, { width: "22px", className: "gv-sk-mono" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Bar, { width })
    ] }, index))
  ] });
}
function FileSkeleton() {
  const widths = ["48%", "66%", "39%", "71%", "52%", "60%", "35%", "58%", "45%"];
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "gv-sk gv-sk-file", "aria-hidden": "true", children: widths.map((width, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "gv-sk-line", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Bar, { width: "22px", className: "gv-sk-mono" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Bar, { width })
  ] }, index)) });
}
function LoadingAnnounce({ label }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "gv-sk-announce", role: "status", "aria-live": "polite", children: label });
}
var treeLoading = () => t("loading.status");
var diffLoading = () => t("loading.diff");
var fileLoading = () => t("loading.file");

// src/diff.jsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var MAX_LINES = 5e3;
function unifiedRows(hunk) {
  const rows = [];
  let oldNo = hunk.oldStart;
  let newNo = hunk.newStart;
  for (const line of hunk.lines) {
    const kind = line[0] === "+" ? "add" : line[0] === "-" ? "del" : "context";
    rows.push({
      kind,
      old: kind === "add" ? void 0 : oldNo++,
      new: kind === "del" ? void 0 : newNo++,
      text: line.slice(1)
    });
  }
  return rows;
}
function splitRows(hunk) {
  const rows = [];
  let oldNo = hunk.oldStart;
  let newNo = hunk.newStart;
  let pending = [];
  const flush = () => {
    for (const line of pending) rows.push({ left: { no: oldNo++, text: line.slice(1), kind: "del" } });
    pending = [];
  };
  for (const line of hunk.lines) {
    const kind = line[0] === "+" ? "add" : line[0] === "-" ? "del" : "context";
    const text = line.slice(1);
    if (kind === "del") pending.push(line);
    else if (kind === "add") {
      rows.push({ right: { no: newNo++, text, kind: "add" } });
    } else {
      flush();
      rows.push({
        left: { no: oldNo++, text, kind: "context" },
        right: { no: newNo++, text, kind: "context" }
      });
    }
  }
  for (const line of pending) rows.push({ left: { no: oldNo++, text: line.slice(1), kind: "del" } });
  return rows;
}
function capHunks(hunks) {
  const kept = [];
  let budget = MAX_LINES;
  let truncated = false;
  for (const hunk of hunks) {
    if (budget <= 0) {
      truncated = true;
      break;
    }
    if (hunk.lines.length > budget) {
      kept.push({ ...hunk, lines: hunk.lines.slice(0, budget) });
      truncated = true;
      break;
    }
    budget -= hunk.lines.length;
    kept.push(hunk);
  }
  return { hunks: kept, truncated };
}
function UnifiedLine({ row, wrap }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: `gv-line ${row.kind}${wrap ? " wrap" : ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "gv-no", children: row.old ?? "" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "gv-no", children: row.new ?? "" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "gv-text", children: row.text || " " })
  ] });
}
function SideLine({ line, wrap }) {
  if (line === void 0) return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "gv-line" });
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: `gv-line ${line.kind}${wrap ? " wrap" : ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "gv-no", children: line.no }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "gv-text", children: line.text || " " })
  ] });
}
function WholeFileView({ data, marks, wrap }) {
  if (data === void 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(LoadingAnnounce, { label: fileLoading() }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FileSkeleton, {})
    ] });
  }
  if (data.kind === "error") return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "gv-note error", children: data.message });
  if (data.kind === "binary") return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "gv-note", children: t("status.binary") });
  if (data.kind === "oversized") return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "gv-note", children: t("status.oversized") });
  const lines = String(data.text ?? "").split("\n");
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
  const isAdded = new Set(marks?.added ?? []);
  const dropped = new Map((marks?.removed ?? []).map((block) => [block.at, block.count]));
  const capped = lines.slice(0, MAX_LINES);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
    capped.map((text, index) => {
      const no = index + 1;
      const marker = dropped.get(no - 1);
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
        marker === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "gv-dropped", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "gv-no", children: no - 1 }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "gv-dropped-note", children: t("diff.removed", { n: marker }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: `gv-line${isAdded.has(no) ? " add" : " ctx"}${wrap ? " wrap" : ""}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "gv-no", children: "" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "gv-no", children: no }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "gv-text", children: text || " " })
        ] })
      ] }, no);
    }),
    dropped.has(capped.length) ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "gv-dropped", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "gv-no", children: capped.length }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "gv-dropped-note", children: t("diff.removed", { n: dropped.get(capped.length) }) })
    ] }) : null,
    lines.length > MAX_LINES ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "gv-note", children: t("status.oversized") }) : null
  ] });
}
function DiffView({ data, split, wrap, whole, added, removed }) {
  if (data === void 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(LoadingAnnounce, { label: diffLoading() }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(DiffSkeleton, {})
    ] });
  }
  if (data.kind === "error") return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "gv-note error", children: data.message });
  if (data.kind === "binary") return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "gv-note", children: t("status.binary") });
  if (data.kind === "oversized") return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "gv-note", children: t("status.oversized") });
  if (data.hunks.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "gv-note", children: t("empty.clean") });
  const { hunks, truncated } = capHunks(data.hunks);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
    hunks.map((hunk, index) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "gv-hunk", children: [
        "@@ -",
        hunk.oldStart,
        ",",
        hunk.oldLines,
        " +",
        hunk.newStart,
        ",",
        hunk.newLines,
        " @@"
      ] }),
      split ? splitRows(hunk).map((row, line) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "gv-split", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "gv-side", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(SideLine, { line: row.left, wrap }) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "gv-side", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(SideLine, { line: row.right, wrap }) })
      ] }, line)) : unifiedRows(hunk).map((row, line) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(UnifiedLine, { row, wrap }, line))
    ] }, index)),
    truncated ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "gv-note", children: t("status.oversized") }) : null
  ] });
}

// src/file.jsx
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react3 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
var MARKDOWN = /* @__PURE__ */ new Set(["md", "markdown", "mdx"]);
var IMAGE = /* @__PURE__ */ new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "avif", "ico"]);
var DOCUMENT = /* @__PURE__ */ new Set(["pdf"]);
function extensionOf(path) {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const cut = name.lastIndexOf(".");
  return cut <= 0 ? "" : name.slice(cut + 1).toLowerCase();
}
function previewKind(path) {
  const extension = extensionOf(path);
  if (MARKDOWN.has(extension)) return "markdown";
  if (IMAGE.has(extension)) return "image";
  if (DOCUMENT.has(extension)) return "document";
  return "source";
}
function labels() {
  return { code: { copyLabel: t("action.copy"), copiedLabel: t("action.copied") }, footnotes: t("action.footnotes") };
}
function FileView({ data, wrap, path }) {
  if (data === void 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(LoadingAnnounce, { label: fileLoading() }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(FileSkeleton, {})
    ] });
  }
  if (data.kind === "error") return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "gv-note error", children: data.message });
  if (data.kind === "binary") return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "gv-note", children: t("status.binary") });
  if (data.kind === "oversized") return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "gv-note", children: t("status.oversized") });
  if (previewKind(path) === "image") {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "gv-file gv-image", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("img", { src: data.dataUrl, alt: path }) });
  }
  if (previewKind(path) === "document") {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "gv-file gv-image", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("object", { data: data.dataUrl, type: "application/pdf", "aria-label": path, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "gv-note", children: [
      t("preview.noDocument"),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("br", {}),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("a", { href: data.dataUrl, download: path.split("/").pop(), children: t("preview.download") })
    ] }) }) });
  }
  if (previewKind(path) === "markdown") {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "gv-file", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_dsh_client_ui_primitives2.MarkdownText, { text: data.text, labels: labels() }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "gv-file", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    import_dsh_client_ui_primitives2.CodeBlock,
    {
      code: data.text,
      lang: (0, import_dsh_client_ui_primitives2.languageForPath)(path),
      lineNumbers: true,
      showHeader: false,
      copyLabel: t("action.copy"),
      copiedLabel: t("action.copied"),
      wrap
    }
  ) });
}
function FileEditor({ data, path, sessionId, onSaved, repoPath }) {
  const [buffer, setBuffer] = (0, import_react3.useState)(data?.text ?? "");
  const [state, setState] = (0, import_react3.useState)("idle");
  const [problem, setProblem] = (0, import_react3.useState)(void 0);
  const area = (0, import_react3.useRef)(void 0);
  (0, import_react3.useEffect)(() => {
    setBuffer(data?.text ?? "");
    setProblem(void 0);
    setState("idle");
  }, [data, path]);
  const save = (0, import_react3.useCallback)(async () => {
    if (state === "saving") return;
    setState("saving");
    setProblem(void 0);
    try {
      const answer = await writeFile(sessionId, path, buffer, data?.version, repoPath);
      setState("saved");
      onSaved?.(answer);
    } catch (error) {
      setProblem(error.message);
      setState("idle");
    }
  }, [state, sessionId, path, buffer, data?.version, onSaved, repoPath]);
  const dirty = data !== void 0 && buffer !== data.text;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "gv-editor", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "textarea",
      {
        ref: area,
        className: "gv-input gv-editor-area",
        value: buffer,
        spellCheck: false,
        "aria-label": path,
        onChange: (event) => {
          setBuffer(event.target.value);
          if (state === "saved") setState("idle");
        },
        onKeyDown: (event) => {
          if (event.key === "s" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            save();
          }
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "gv-editor-bar", children: [
      dirty ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "gv-dirty", children: t("edit.dirty") }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "gv-note-inline", children: t("edit.clean") }),
      problem === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "gv-editor-problem", children: problem }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "gv-spacer" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "gv-editor-hint", children: t("edit.hint") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "button",
        {
          type: "button",
          className: "gv-btn primary",
          disabled: !dirty || state === "saving",
          onClick: save,
          children: state === "saving" ? t("edit.saving") : state === "saved" ? t("edit.saved") : t("edit.save")
        }
      )
    ] })
  ] });
}

// src/hover.jsx
var import_react4 = require("react");
var import_jsx_runtime6 = require("react/jsx-runtime");
var HOVER_DELAY_MS = 450;
var MAX_LINES2 = 60;
function HoverCard({ hover, sessionId, onDismiss }) {
  const [diff, setDiff] = (0, import_react4.useState)(void 0);
  const [failed, setFailed] = (0, import_react4.useState)(false);
  const cardRef = (0, import_react4.useRef)(void 0);
  const target = hover === void 0 ? void 0 : `${hover.side}${hover.file.path}`;
  const targetPath = hover?.file.path;
  const targetSide = hover?.side;
  (0, import_react4.useEffect)(() => {
    if (target === void 0) return void 0;
    let current = true;
    setDiff(void 0);
    setFailed(false);
    const timer = setTimeout(async () => {
      try {
        const answer = await readDiff(sessionId, targetPath, targetSide);
        if (!current) return;
        setDiff(answer);
      } catch {
        if (!current) return;
        setFailed(true);
      }
    }, HOVER_DELAY_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [target, targetPath, targetSide, sessionId]);
  (0, import_react4.useEffect)(() => {
    if (hover === void 0) return void 0;
    const onKey = (event) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hover, onDismiss]);
  if (hover === void 0) return null;
  const rows = (diff?.hunks ?? []).flatMap((hunk) => unifiedRows(hunk));
  const shown = rows.slice(0, MAX_LINES2);
  const rest = rows.length - shown.length;
  const added = rows.filter((row) => row.kind === "add").length;
  const removed = rows.filter((row) => row.kind === "del").length;
  const width = 460;
  const margin = 16;
  const flipX = hover.x + width + margin * 3 > globalThis.innerWidth;
  const flipY = hover.y + 320 > globalThis.innerHeight;
  const left = flipX ? Math.max(margin, hover.x - width - margin) : hover.x + margin;
  const top = flipY ? Math.max(margin, hover.y - 280) : hover.y + margin;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    "div",
    {
      ref: cardRef,
      className: "gv-hover",
      style: { left: `${left}px`, top: `${top}px`, width: `${width}px` },
      role: "tooltip",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "gv-hover-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: `gv-letter ${hover.letter}`, "aria-hidden": "true", children: hover.file.status }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "gv-hover-path", title: hover.file.path, children: hover.file.name }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "gv-hover-count", children: diff === void 0 || rows.length === 0 ? "" : `+${added} \u2212${removed}` })
        ] }),
        failed ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "gv-hover-note", children: t("preview.hoverFailed") }) : diff === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "gv-hover-note", children: t("preview.hoverLoading") }) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "gv-hover-note", children: t("preview.hoverEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "gv-hover-body", children: shown.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: `gv-hover-line ${row.kind}`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "gv-hover-no", children: row.kind === "add" ? row.new : row.old }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "gv-hover-sign", "aria-hidden": "true", children: row.kind === "add" ? "+" : row.kind === "del" ? "-" : " " }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "gv-hover-text", children: row.text })
          ] }, `${row.old}:${row.new}:${index}`)) }),
          rest > 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "gv-hover-note", children: t("preview.hoverMore", { n: rest }) }) : null
        ] })
      ]
    }
  );
}
function useFileHover(sessionId) {
  const [hover, setHover] = (0, import_react4.useState)(void 0);
  const onEnter = (0, import_react4.useCallback)((file, side, letter, event) => {
    setHover({ file, side, letter, x: event.clientX, y: event.clientY });
  }, []);
  const onMove = (0, import_react4.useCallback)((event) => {
    setHover((current) => current === void 0 ? current : { ...current, x: event.clientX, y: event.clientY });
  }, []);
  const onLeave = (0, import_react4.useCallback)(() => setHover(void 0), []);
  const dismiss = (0, import_react4.useCallback)(() => setHover(void 0), []);
  const bind = (0, import_react4.useCallback)(
    (file, side, letter) => ({
      onMouseEnter: (event) => onEnter(file, side, letter, event),
      onMouseMove: onMove,
      onMouseLeave: onLeave
    }),
    [onEnter, onMove, onLeave]
  );
  return {
    hover,
    bind,
    dismiss,
    card: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(HoverCard, { hover, sessionId, onDismiss: dismiss })
  };
}

// src/repo.jsx
var import_dsh_client_ui_primitives3 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react5 = require("react");
var import_jsx_runtime7 = require("react/jsx-runtime");
function RepoBulkMenu({ status, run, confirm, busy }) {
  const [open, setOpen] = (0, import_react5.useState)(false);
  const close = () => setOpen(false);
  const workingTree = [...status.unstaged, ...status.conflicts];
  const untracked = workingTree.filter((file) => file.status === "?");
  const unstaged = workingTree.filter((file) => file.status !== "?");
  const staged = status.staged;
  const count = (list, key) => t(key, { n: list.length });
  const items = [];
  if (unstaged.length + untracked.length > 0) {
    items.push({ id: "stageAll", label: count([...unstaged, ...untracked], "repo.stageAll") });
  }
  if (staged.length > 0) items.push({ id: "unstageAll", label: count(staged, "repo.unstageAll") });
  if (unstaged.length > 0) {
    items.push({ type: "separator", id: "a" });
    items.push({ id: "discardAll", label: count(unstaged, "repo.discardAll"), danger: true });
  }
  if (untracked.length > 0) {
    items.push({ id: "discardUntracked", label: count(untracked, "repo.discardUntracked"), danger: true });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    import_dsh_client_ui_primitives3.Menu,
    {
      open,
      align: "end",
      dense: true,
      portal: true,
      anchor: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "button",
        {
          type: "button",
          className: "gv-btn",
          "aria-expanded": open,
          "aria-label": t("repo.bulk"),
          title: t("repo.bulk"),
          disabled: busy || items.length === 0,
          onClick: () => setOpen((value) => !value),
          children: "\u22EF\u22EF"
        }
      ),
      items,
      onSelect: (id) => {
        close();
        const all = [...unstaged, ...untracked].map((file) => file.path);
        if (id === "stageAll") run({ action: "stage", paths: all });
        else if (id === "unstageAll") run({ action: "unstage", paths: staged.map((file) => file.path) });
        else if (id === "discardAll") {
          confirm(
            t("risk.discardAllTitle"),
            t("risk.discardAllBody", { n: unstaged.length }),
            { action: "discard", side: "unstaged", paths: unstaged.map((file) => file.path) }
          );
        } else if (id === "discardUntracked") {
          confirm(
            t("risk.deleteAllTitle"),
            t("risk.deleteAllBody", { n: untracked.length }),
            { action: "discard", side: "untracked", paths: untracked.map((file) => file.path) }
          );
        }
      },
      onClose: close
    }
  );
}
function RemoteActions({ repo, run, busy }) {
  const noRemote = repo.hasRemote === false;
  const noUpstream = !repo.upstream;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "gv-remote", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "button",
      {
        type: "button",
        className: "gv-btn",
        disabled: busy || noRemote || noUpstream,
        title: noRemote ? t("remote.noRemote") : noUpstream ? t("remote.noUpstream") : t("repo.pull"),
        "aria-label": t("repo.pull"),
        onClick: () => run(
          { action: "pull" },
          { working: t("action.pulling"), done: t("action.pulled") }
        ),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { "aria-hidden": "true", children: "\u2193" }),
          " ",
          t("repo.pull")
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "button",
      {
        type: "button",
        className: "gv-btn",
        disabled: busy || noRemote || noUpstream,
        title: noRemote ? t("remote.noRemote") : noUpstream ? t("remote.noUpstream") : t("repo.sync"),
        "aria-label": t("repo.sync"),
        onClick: () => run(
          { action: "sync" },
          { working: t("action.syncing"), done: t("action.synced") }
        ),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { "aria-hidden": "true", children: "\u21C5" }),
          " ",
          t("repo.sync")
        ]
      }
    )
  ] });
}
function BranchMenu({ sessionId, repo, run, repoPath }) {
  const [open, setOpen] = (0, import_react5.useState)(false);
  const [roster, setRoster] = (0, import_react5.useState)(void 0);
  const [creating, setCreating] = (0, import_react5.useState)(false);
  const [name, setName] = (0, import_react5.useState)("");
  const close = () => setOpen(false);
  (0, import_react5.useEffect)(() => {
    if (!open) return void 0;
    const controller = new AbortController();
    setRoster(void 0);
    setCreating(false);
    readBranches(sessionId, repoPath, controller.signal).then(setRoster).catch((error) => setRoster({ error: error.message }));
    return () => controller.abort();
  }, [sessionId, repoPath, open]);
  const locals = roster?.branches?.filter((branch) => !branch.remote) ?? [];
  const remotes = roster?.branches?.filter((branch) => branch.remote) ?? [];
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    import_dsh_client_ui_primitives3.Menu,
    {
      open,
      align: "start",
      dense: true,
      portal: true,
      anchor: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
        "button",
        {
          type: "button",
          className: "gv-branch",
          title: repo.upstream ?? repo.branch ?? "",
          "aria-expanded": open,
          onClick: () => setOpen((value) => !value),
          children: [
            repo.detached ? `${t("branch.detached")} @ ${(repo.oid ?? "").slice(0, 7)}` : repo.branch,
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { "aria-hidden": "true", children: " \u25BE" })
          ]
        }
      ),
      onClose: close,
      children: creating ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "gv-branch-new", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "input",
          {
            className: "gv-input",
            value: name,
            autoFocus: true,
            placeholder: t("branch.newPlaceholder"),
            onChange: (event) => setName(event.target.value),
            onKeyDown: (event) => {
              if (event.key !== "Enter" || name.trim() === "") return;
              const body = { action: "branch.create", name: name.trim() };
              setCreating(false);
              setName("");
              close();
              run(body);
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "button",
          {
            type: "button",
            className: "gv-btn primary",
            disabled: name.trim() === "",
            onClick: () => {
              const body = { action: "branch.create", name: name.trim() };
              setCreating(false);
              setName("");
              close();
              run(body);
            },
            children: t("branch.create")
          }
        )
      ] }) : roster?.error !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "gv-menu-note", children: roster.error }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
        locals.map((branch) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
          "button",
          {
            type: "button",
            className: "gv-menu-row",
            disabled: branch.current,
            onClick: () => {
              close();
              run({ action: "checkout", branch: branch.name });
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: branch.name }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "gv-menu-meta", children: [
                branch.current ? t("branch.current") : "",
                branch.ahead > 0 ? ` \u2191${branch.ahead}` : "",
                branch.behind > 0 ? ` \u2193${branch.behind}` : ""
              ] })
            ]
          },
          branch.name
        )),
        remotes.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "gv-menu-group", children: t("branch.remote") }) : null,
        remotes.map((branch) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
          "button",
          {
            type: "button",
            className: "gv-menu-row",
            onClick: () => {
              close();
              run({ action: "checkout", branch: branch.name });
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: branch.name }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "gv-menu-meta", children: branch.sha })
            ]
          },
          branch.name
        )),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "button",
          {
            type: "button",
            className: "gv-menu-row",
            onClick: () => setCreating(true),
            disabled: repo.detached,
            children: t("branch.new")
          }
        )
      ] })
    }
  );
}
function StashMenu({ sessionId, run, confirm, repoPath }) {
  const [open, setOpen] = (0, import_react5.useState)(false);
  const [stashes, setStashes] = (0, import_react5.useState)(void 0);
  const close = () => setOpen(false);
  (0, import_react5.useEffect)(() => {
    if (!open) return void 0;
    const controller = new AbortController();
    setStashes(void 0);
    readStashes(sessionId, repoPath, controller.signal).then((answer) => setStashes(answer.stashes)).catch((error) => setStashes({ error: error.message }));
    return () => controller.abort();
  }, [sessionId, repoPath, open]);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    import_dsh_client_ui_primitives3.Menu,
    {
      open,
      align: "end",
      dense: true,
      portal: true,
      anchor: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "button",
        {
          type: "button",
          className: "gv-btn",
          "aria-expanded": open,
          title: t("stash.title"),
          onClick: () => setOpen((value) => !value),
          children: t("stash.title")
        }
      ),
      onClose: close,
      children: stashes === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "gv-menu-note", children: "\u2026" }) : Array.isArray(stashes) === false ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "gv-menu-note", children: stashes.error }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "button",
          {
            type: "button",
            className: "gv-menu-row",
            onClick: () => {
              close();
              run({ action: "stash.push" });
            },
            children: t("stash.push")
          }
        ),
        stashes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "gv-menu-note", children: t("stash.empty") }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "gv-menu-group", children: t("stash.list") }),
          stashes.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "gv-stash", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
              "button",
              {
                type: "button",
                className: "gv-menu-row",
                onClick: () => {
                  close();
                  run({ action: "stash.apply", ref: entry.ref });
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: entry.message || entry.ref }),
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "gv-menu-meta", children: [
                    entry.branch === null ? "" : `${entry.branch} \xB7 `,
                    t("stash.files", { n: entry.files })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              "button",
              {
                type: "button",
                className: "gv-menu-row danger",
                onClick: () => {
                  close();
                  confirm(t("risk.dropTitle"), t("risk.dropBody").replace("{entry}", entry.message || entry.ref), {
                    action: "stash.drop",
                    ref: entry.ref
                  });
                },
                children: t("stash.drop")
              }
            )
          ] }, entry.ref)),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "button",
            {
              type: "button",
              className: "gv-menu-row danger",
              onClick: () => {
                close();
                confirm(t("risk.clearTitle"), t("risk.clearBody"), { action: "stash.clear" });
              },
              children: t("stash.clear")
            }
          )
        ] })
      ] })
    }
  );
}

// src/marks.js
function markChanges(hunks) {
  const added = [];
  const removed = [];
  for (const hunk of hunks ?? []) {
    let next = hunk.newStart;
    let block;
    for (const line of hunk.lines ?? []) {
      const prefix = line[0];
      if (prefix === "+") {
        added.push(next);
        next += 1;
        block = void 0;
      } else if (prefix === " ") {
        next += 1;
        block = void 0;
      } else if (prefix === "-") {
        if (block === void 0) {
          block = { at: next - 1, count: 0 };
          removed.push(block);
        }
        block.count += 1;
      }
    }
  }
  return { added, removed };
}

// src/tree.jsx
var import_react6 = require("react");

// src/treebuild.js
function sideOf(file, side) {
  if (side === "unstaged" && file.status === "?") return "untracked";
  return side;
}
function buildTree(files) {
  const root = { name: "", path: "", dirs: [], files: [], all: [] };
  const index = /* @__PURE__ */ new Map([["", root]]);
  const dirNode = (path) => {
    const parts = path.replace(/\/+$/, "").split("/");
    let parent = root;
    for (let depth = 0; depth < parts.length; depth += 1) {
      const here = parts.slice(0, depth + 1).join("/");
      let dir = index.get(here);
      if (dir === void 0) {
        dir = { name: parts[depth], path: here, dirs: [], files: [], all: [] };
        index.set(here, dir);
        parent.dirs.push(dir);
      }
      parent = dir;
    }
    return parent;
  };
  for (const file of files) {
    if (file.dir === true) {
      dirNode(file.path).all.push(file);
      continue;
    }
    const parts = file.path.split("/");
    let parent = root;
    for (let depth = 0; depth < parts.length - 1; depth += 1) {
      const path = parts.slice(0, depth + 1).join("/");
      let dir = index.get(path);
      if (dir === void 0) {
        dir = { name: parts[depth], path, dirs: [], files: [], all: [] };
        index.set(path, dir);
        parent.dirs.push(dir);
      }
      dir.all.push(file);
      parent = dir;
    }
    const leaf = { ...file, name: parts[parts.length - 1] };
    parent.files.push(leaf);
  }
  return root;
}

// src/tree.jsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var LETTERS = {
  M: "gv-letter-M",
  A: "gv-letter-A",
  D: "gv-letter-D",
  R: "gv-letter-R",
  C: "gv-letter-C",
  U: "gv-letter-U",
  "?": "gv-letter-Q"
};
var INDENT = 12;
function Counts({ files }) {
  let added = 0;
  let removed = 0;
  let binary = false;
  for (const file of files) {
    added += file.added ?? 0;
    removed += file.deleted ?? 0;
    if (file.binary) binary = true;
  }
  const out = [];
  if (added > 0) out.push(`+${added}`);
  if (removed > 0) out.push(`-${removed}`);
  if (binary) out.push(t("status.binary"));
  return out.map((text) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
    "span",
    {
      className: `gv-num ${text.startsWith("+") ? "gv-add" : text.startsWith("-") ? "gv-del" : "gv-flag"}`,
      children: text
    },
    text
  ));
}
function sortNode(node) {
  node.dirs.sort((a, b) => a.name.localeCompare(b.name));
  node.files.sort((a, b) => a.name.localeCompare(b.name));
  for (const dir of node.dirs) sortNode(dir);
}
function collectVisible(node, collapsed, side, into) {
  for (const file of node.files) into.push({ ...file, side: sideOf(file, side) });
  for (const dir of node.dirs) {
    if (collapsed.has(`${side}:${dir.path}`)) continue;
    collectVisible(dir, collapsed, side, into);
  }
}
function visibleOrder(status, collapsed) {
  const groups = [
    ["conflicts", "unstaged", status.conflicts],
    ["staged", "staged", status.staged],
    ["unstaged", "unstaged", status.unstaged]
  ];
  const order = [];
  for (const [key, side, files] of groups) {
    if (collapsed.has(key)) continue;
    const root = buildTree(files);
    sortNode(root);
    collectVisible(root, collapsed, side, order);
  }
  return order;
}
function FileRow({ file, side, depth, selected, onSelect, actions, hover, checked, onCheck }) {
  const letter = LETTERS[file.status] ?? "gv-letter-M";
  const isChecked = checked.has(file.path);
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "gv-row-wrap", children: [
    onCheck === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { className: "gv-check", title: t("selection.checkTitle"), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      "input",
      {
        type: "checkbox",
        checked: isChecked,
        "aria-label": file.path,
        onChange: () => onCheck(file.path)
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
      "button",
      {
        type: "button",
        className: "gv-row",
        style: { paddingLeft: 8 + depth * INDENT, "--d": depth },
        "aria-selected": selected?.path === file.path && selected?.side === side,
        onClick: () => onSelect({ ...file, side }),
        title: file.path,
        ...hover === void 0 ? {} : hover.bind(file, side, letter),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "gv-chevron", "aria-hidden": "true" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: `gv-letter ${letter}`, "aria-hidden": "true", children: file.status }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "gv-name", children: file.name }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Counts, { files: [file] })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(RowActions, { file, side, run: actions.run, confirm: actions.confirm })
  ] });
}
function DirRow({ dir, side, depth, collapsed, onToggle, selected, onSelect, actions, hover, checked, onCheck, expand }) {
  const key = `${side}:${dir.path}`;
  const open = !collapsed.has(key);
  const wantsContents = dir.all.some((file) => file.dir === true);
  const info = expand?.state.get(dir.path);
  const loading = open && wantsContents && info?.loading === true;
  const failed = open && wantsContents && info?.failure !== void 0;
  (0, import_react6.useEffect)(() => {
    if (open && wantsContents && info === void 0) expand?.request(dir.path);
  }, [open, wantsContents, info, dir.path, expand]);
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "gv-row-wrap", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
        "button",
        {
          type: "button",
          className: "gv-row gv-dir",
          style: { paddingLeft: 8 + depth * INDENT, "--d": depth },
          "aria-expanded": open,
          onClick: () => onToggle(key),
          title: dir.path,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "gv-chevron", "aria-hidden": "true", children: open ? "\u25BE" : "\u25B8" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "gv-letter", "aria-hidden": "true" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "gv-name", children: dir.name }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Counts, { files: dir.all }),
            info?.truncated === true ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "gv-num gv-add", children: [
              "+",
              info.total - (info.files?.length ?? 0)
            ] }) : null
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        DirActions,
        {
          side,
          files: dir.all,
          paths: dir.all.map((file) => file.path),
          run: actions.run,
          confirm: actions.confirm
        }
      )
    ] }),
    loading ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "gv-row gv-subnote", style: { paddingLeft: 8 + (depth + 1) * INDENT }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: `gv-spin`, "aria-hidden": "true", children: "\u27F3" }),
      " ",
      t("tree.reading")
    ] }) : null,
    failed ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "gv-row gv-subnote error", style: { paddingLeft: 8 + (depth + 1) * INDENT }, children: info.failure }) : null,
    open ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      TreeLevel,
      {
        node: dir,
        side,
        depth: depth + 1,
        ...{ collapsed, onToggle, selected, onSelect, actions, hover, checked, onCheck, expand }
      }
    ) : null
  ] });
}
function TreeLevel({ node, side, depth, collapsed, onToggle, selected, onSelect, actions, hover, checked, onCheck, expand }) {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    node.dirs.map((dir) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      DirRow,
      {
        dir,
        side,
        depth,
        collapsed,
        onToggle,
        selected,
        onSelect,
        actions,
        hover,
        checked,
        onCheck,
        expand
      },
      dir.path
    )),
    node.files.map((file) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      FileRow,
      {
        file,
        side,
        depth,
        selected,
        onSelect,
        actions,
        hover,
        checked,
        onCheck
      },
      file.path
    ))
  ] });
}
function FileGroup({ title, files, side, selected, onSelect, open, onToggle, collapsed, onToggleDir, actions, hover, checked, onCheck, total, expand }) {
  if (files.length === 0) return null;
  const root = buildTree(files);
  sortNode(root);
  const hidden = (total ?? files.length) - files.length;
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { className: "gv-group", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "gv-group-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("button", { type: "button", className: "gv-group-head", onClick: onToggle, "aria-expanded": open, children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "gv-chevron", "aria-hidden": "true", children: open ? "\u25BE" : "\u25B8" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { children: [
          title,
          " (",
          total ?? files.length,
          ")"
        ] }),
        hidden > 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "gv-count-hidden", children: [
          "+",
          hidden
        ] }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        GroupActions,
        {
          side,
          files,
          paths: files.map((file) => file.path),
          run: actions.run,
          confirm: actions.confirm
        }
      )
    ] }),
    open ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      TreeLevel,
      {
        node: root,
        side,
        depth: 0,
        collapsed,
        onToggle: onToggleDir,
        selected,
        onSelect,
        actions,
        hover,
        checked,
        onCheck,
        expand
      }
    ) : null
  ] });
}
function FileTree({ status, selected, onSelect, collapsed, onToggle, onToggleDir, actions, hover, checked, onCheck, expand }) {
  const groups = [
    { key: "conflicts", side: "unstaged", title: t("group.conflicts"), files: status.conflicts },
    { key: "staged", side: "staged", title: t("group.staged"), files: status.staged },
    { key: "unstaged", side: "unstaged", title: t("group.unstaged"), files: status.unstaged }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "gv-tree", role: "tree", children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
    FileGroup,
    {
      title: group.title,
      side: group.side,
      files: group.files,
      total: status.counts?.[group.key]?.total,
      selected,
      onSelect,
      open: !collapsed.has(group.key),
      onToggle: () => onToggle(group.key),
      collapsed,
      onToggleDir,
      actions,
      hover,
      checked,
      onCheck,
      expand
    },
    group.key
  )) });
}

// src/styles.js
var CSS = `
/* Every scroll region below is bounded by --gv-room, the height the composer
   leaves us, measured in JS because nothing in the slot's ancestor chain can
   know it. The 600px fallback covers the frame before the first measurement. */
.gv{--gv-room:600px;display:flex;flex-direction:column;width:100%;height:var(--gv-room);min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}
.gv-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);flex:0 0 auto}
.gv-repo{font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gv-branch{display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:2px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;white-space:nowrap}
.gv-count{font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.gv-spacer{flex:1}
.gv-subnote{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:20px}
.gv-subnote.error{color:var(--dsw-alias-state-error-primary)}
.gv-spin{display:inline-block;animation:gv-spin .9s linear infinite}
@keyframes gv-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.gv-spin{animation:none}}
.gv-btn{font:inherit;font-size:12px;padding:3px 10px;border-radius:6px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer}
/* Interaction surfaces.
   These do not use the layer tokens: in this theme --dsw-alias-bg-layer-1 and
   -2 are both #fff, exactly the panel background, so every hover, selection,
   hunk header and field computed to white on white. Mixing the label colour
   instead is guaranteed to differ from the base in both themes. */
.gv{--gv-hover:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent);
  --gv-sunken:color-mix(in srgb,var(--dsw-alias-label-primary) 4%,transparent);
  --gv-selected:color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent);
  --gv-selected-line:color-mix(in srgb,var(--dsw-alias-brand-primary) 38%,transparent)}
.gv-btn:hover{background:var(--gv-hover)}
.gv-btn[aria-pressed="true"]{background:var(--gv-selected);border-color:var(--dsw-alias-brand-primary)}
.gv-btn:disabled{opacity:.5;cursor:default}
/* Every scroll region below is sized by what is left of this box, not by the
   viewport. The composer floats over the bottom of the tab, so a 100dvh-based
   height hides the last rows behind it. */
.gv-body{display:flex;align-items:stretch;flex:1 1 auto;min-height:0}
.gv-list{flex:0 0 auto;min-width:220px;max-width:60%;display:flex;flex-direction:column;min-height:0;border-right:1px solid var(--dsw-alias-border-l1)}
.gv-sizer{flex:0 0 5px;margin:0 -3px;cursor:col-resize;background:transparent;position:relative;z-index:3;touch-action:none}
.gv-sizer:hover,.gv-sizer:focus-visible{background:var(--dsw-alias-border-l1)}
.gv-tree-scroll{flex:1 1 auto;order:1;min-height:0;max-height:var(--gv-room);overflow:auto;outline:none}
.gv-tree-scroll:focus-visible{box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary)}
.gv-tree{min-height:0;overflow:visible;padding:4px 0}
.gv-banner{padding:6px 12px;font-size:12px;white-space:pre-wrap;word-break:break-word;border-bottom:1px solid var(--dsw-alias-border-l1);flex:0 0 auto}
.gv-banner.error{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary)}
/* Below the file list, not above it: putting the commit box first spent the
   most valuable vertical space on a text box nobody reads until the changes
   are read. */
.gv-commit{order:3;flex:0 0 auto;padding:8px;border-top:1px solid var(--dsw-alias-border-l1);display:flex;flex-direction:column;gap:4px;background:var(--dsw-alias-bg-base)}
/* The box, then its two actions on a row of their own: three glyph-only
   buttons in a 36px column made the disabled one read as an empty box and left
   committing as an unlabelled tick. */
.gv-commit-row{position:relative;display:flex;gap:6px;align-items:stretch}
.gv-commit-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.gv-commit-bar .gv-commit-go{flex:1 1 90px;min-width:80px}
.gv-commit-toggle{flex:0 0 28px;width:28px;padding:0}
/* At the top right, over the field's first line. Three classes on purpose: the
   shared icon-button rule is width:100% at equal specificity, so without them
   the later rule would stretch this across the field and eat clicks on the
   first line of text. */
.gv-btn.icon.gv-commit-expand{position:absolute;top:4px;right:6px;width:24px;height:24px;padding:0;border-color:transparent;background:none;color:var(--dsw-alias-label-secondary)}
.gv-commit-expand:hover{border-color:var(--dsw-alias-border-l1);background:var(--gv-hover);color:var(--dsw-alias-label-primary)}
/* Open: the field takes the panel's leftover height and the tree above it
   gives up the room. The panel grows upward, the direction the control says
   it grows. */
.gv-commit.is-open{flex:1 1 auto;min-height:0}
.gv-list:has(.gv-commit.is-open) .gv-tree-scroll{flex:0 1 auto;max-height:35%}
.gv-commit.is-open .gv-commit-row{flex:1 1 auto;min-height:0}
.gv-commit.is-open .gv-textarea{height:100%}
.gv-push-list{max-height:min(46vh,420px);overflow:auto}
.gv-push-commits{list-style:none;margin:0;padding:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px}
.gv-push-commit{display:flex;gap:8px;align-items:baseline;padding:4px 6px;border-radius:4px}
.gv-push-commit:nth-child(odd){background:var(--gv-sunken)}
.gv-push-sha{flex:0 0 auto;color:var(--dsw-alias-label-secondary)}
.gv-push-subject{flex:1;min-width:0;color:var(--dsw-alias-label-primary);overflow-wrap:anywhere}
.gv-push-empty{margin:0;color:var(--dsw-alias-label-secondary)}
/* Push follows Commit and is sized by its own label rather than sharing the
   leftover width, so the two never read as one split button. */
.gv-commit-push{flex:0 0 auto}
.gv-commit-hint{font-size:11px;color:var(--dsw-alias-label-secondary);padding:0 2px}
.gv-commit-note{font-size:12px;color:var(--dsw-alias-label-secondary);padding:0 2px}
.gv-commit-note.error{color:var(--dsw-alias-state-error-primary);white-space:pre-wrap;word-break:break-word}
/* A finished action, where nothing else in the panel would show that it
   happened at all. Success-toned rather than neutral, because the line it
   replaces is the one that reports refusals. */
.gv-commit-note.done{color:var(--dsw-alias-state-success-primary)}
.gv-hover{position:fixed;z-index:60;pointer-events:none;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.28);overflow:hidden;font-size:12px}
.gv-hover-head{display:flex;align-items:center;gap:6px;padding:6px 8px;background:var(--gv-sunken);border-bottom:1px solid var(--dsw-alias-border-l1)}
.gv-hover-path{flex:1;min-width:0;font-weight:600;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gv-hover-count{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap}
.gv-hover-body{max-height:280px;overflow:hidden}
.gv-hover-line{display:flex;gap:6px;padding:0 8px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;line-height:1.5;white-space:pre}
.gv-hover-no{width:38px;flex:0 0 auto;text-align:right;color:var(--dsw-alias-label-secondary);opacity:.6}
.gv-hover-sign{width:8px;flex:0 0 auto;text-align:center;color:var(--dsw-alias-label-secondary)}
.gv-hover-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-primary)}
.gv-hover-line.add{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent)}
.gv-hover-line.add .gv-hover-sign{color:var(--dsw-alias-state-success-primary)}
.gv-hover-line.del{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent)}
.gv-hover-line.del .gv-hover-sign{color:var(--dsw-alias-state-error-primary)}
.gv-hover-note{margin:0;padding:6px 8px;color:var(--dsw-alias-label-secondary);background:var(--gv-sunken)}
/* The checkbox appears on the row you are looking at, not on every row above
   it: always-on checkboxes draw a permanent column of empty squares down the
   tree. The slot stays reserved so names do not jump on hover. */
.gv-check{flex:0 0 auto;display:flex;align-items:center;padding:0 2px 0 8px;cursor:pointer}
.gv-check input{margin:0;cursor:pointer;accent-color:var(--dsw-alias-brand-primary);opacity:0}
.gv-row-wrap:hover .gv-check input,.gv-group-row:hover .gv-check input,.gv-check input:focus-visible,.gv-check input:checked{opacity:1}
.gv-row-wrap:has(.gv-check) .gv-row{padding-left:4px}
.gv-selection{order:2;flex:0 0 auto;display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:6px 8px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--gv-sunken)}
.gv-selection-count{font-size:12px;color:var(--dsw-alias-label-secondary);margin-right:2px}
/* Native resize turned off because the grip cannot be moved to the top right. */
.gv-textarea{flex:1;min-width:0;min-height:52px;resize:none;padding-right:32px;font-family:inherit;line-height:1.5}
.gv-commit-go{display:flex;align-items:center;justify-content:center;gap:5px;padding:4px 10px;font-size:12px;line-height:1.4}
.gv-commit .gv-input{flex:1;min-width:0}
.gv-btn.icon{width:100%;padding:0;height:26px;text-align:center;font-size:13px;line-height:1}
.gv-input{font:inherit;font-size:12px;padding:3px 8px;border-radius:6px;border:1px solid var(--dsw-alias-border-l2);background:var(--gv-sunken);color:var(--dsw-alias-label-primary)}
.gv-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.gv-btn.primary{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent)}
.gv-btn.primary:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-brand-primary) 24%,transparent)}
.gv-btn.wide{flex:1;width:100%}
.gv-detail{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;min-height:0}
.gv-detail-head{display:flex;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:0 0 auto;flex-wrap:wrap}
.gv-path{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:320px}
.gv-scroll{flex:1 1 auto;min-height:0;max-height:var(--gv-room);overflow:auto}
.gv-note{padding:24px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:13px}
/* Loading placeholders. They hold the shape of the answer so the panel does not
   jump, and they move so a slow status call reads as work, not as a broken view. */
.gv-sk{padding:6px 0}
.gv-sk-group{margin-bottom:6px}
.gv-sk-head{display:flex;align-items:center;gap:6px;padding:5px 10px}
.gv-sk-row,.gv-sk-line{display:flex;align-items:center;gap:6px}
.gv-sk-row{height:22px}
.gv-sk-line{height:18px;padding:0 12px;gap:8px}
.gv-sk-file{padding:8px 0}
.gv-sk-hunk{padding:4px 12px;background:var(--gv-sunken)}
.gv-sk-spacer{flex:1}
.gv-sk-bar{display:block;height:9px;border-radius:4px;background:color-mix(in srgb,var(--dsw-alias-label-secondary) 30%,transparent);animation:gv-sk-pulse 1.4s ease-in-out infinite}
.gv-sk-mono{height:8px;opacity:.7}
/* Added and removed rows are tinted like the real ones, so the placeholder
   reads as a comparison rather than as generic text. */
.gv-sk-line.add .gv-sk-bar:last-child{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 26%,transparent)}
.gv-sk-line.del .gv-sk-bar:last-child{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 26%,transparent)}
/* Staggered so the rows do not pulse in unison, which reads as a blinking
   block instead of as loading. */
.gv-sk-group:nth-child(2) .gv-sk-bar{animation-delay:.18s}
.gv-sk-line:nth-child(3n) .gv-sk-bar{animation-delay:.24s}
.gv-sk-line:nth-child(3n+1) .gv-sk-bar{animation-delay:.4s}
@keyframes gv-sk-pulse{0%,100%{opacity:.45}50%{opacity:.9}}
@media (prefers-reduced-motion:reduce){.gv-sk-bar{animation:none;opacity:.6}}
.gv-sk-announce{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.gv-note.error{color:var(--dsw-alias-state-error-primary);text-align:left;white-space:pre-wrap;word-break:break-word}
.gv-note-inline{color:var(--dsw-alias-label-secondary);font-size:12px}
.gv-file.gv-image{display:flex;align-items:flex-start;justify-content:center;padding:16px}
.gv-file.gv-image img{max-width:100%;height:auto;border-radius:6px}
.gv-file.gv-image object{width:100%;height:70vh;border:0;border-radius:6px}
.gv-editor{display:flex;flex-direction:column}
/* The container this renders into is content-driven, so a percentage height
   resolves to nothing and the field collapses to a single line. */
.gv-editor-area{flex:0 0 auto;height:max(220px,var(--gv-room));font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.55;resize:vertical;border-radius:0;border-left:0;border-right:0}
.gv-editor-bar{position:sticky;bottom:0;display:flex;align-items:center;gap:10px;padding:6px 10px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);font-size:12px}
.gv-dirty{color:var(--dsw-alias-state-warn-primary)}
.gv-editor-problem{color:var(--dsw-alias-state-error-primary);white-space:pre-wrap;word-break:break-word}
.gv-editor-hint{color:var(--dsw-alias-label-secondary)}
.gv-remote{display:inline-flex;align-items:center;gap:4px;flex-wrap:wrap}

.gv-group{margin-bottom:2px}
.gv-group-head{display:flex;align-items:center;gap:4px;padding:3px 10px;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.03em;color:var(--dsw-alias-label-secondary);cursor:pointer;user-select:none;background:transparent;border:0;text-align:left;font-family:inherit}
.gv-group-head:hover{background:var(--gv-hover)}
.gv-row{position:relative;display:flex;align-items:center;gap:6px;width:100%;padding:2px 10px 2px 8px;font:inherit;font-size:12px;background-color:transparent;border:0;color:inherit;cursor:pointer;text-align:left;white-space:nowrap}
/* Depth guides. Without them a path three folders down is the same list as one
   folder down, and the eye has to re-parse the indent to find the file again. */
.gv-row::before{content:'';position:absolute;top:0;bottom:0;left:8px;width:calc(var(--d,0) * 12px);pointer-events:none;background-image:repeating-linear-gradient(to right,var(--dsw-alias-border-l1) 0 1px,transparent 1px 12px);background-position:6px 0}
.gv-row:hover{background:var(--gv-hover)}
/* A left bar as well as a fill: colour alone is a weak signal for anyone who
   cannot separate these two hues, and it is what the panel this copies does. */
.gv-row[aria-selected="true"]{background:var(--gv-selected);box-shadow:inset 2px 0 0 0 var(--gv-selected-line)}
.gv-chevron{flex:0 0 12px;font-size:10px;color:var(--dsw-alias-label-secondary);text-align:center;line-height:1.4}
.gv-row.gv-dir .gv-name{font-weight:500}
.gv-row-wrap{position:relative;display:flex;align-items:stretch}
.gv-row-wrap>.gv-row{flex:1;min-width:0}
.gv-row-actions{flex:0 0 auto;display:flex;align-items:center;gap:1px;padding-right:4px;opacity:0}
.gv-row-wrap:hover .gv-row-actions,.gv-row-wrap:focus-within .gv-row-actions{opacity:1}
.gv-quick{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:14px;line-height:1}
.gv-quick:hover{background:var(--gv-hover);color:var(--dsw-alias-label-primary)}
.gv-group-row{display:flex;align-items:stretch}
.gv-group-row>.gv-group-head{flex:1;min-width:0}
.gv-group-actions{flex:0 0 auto;display:flex;align-items:center;gap:1px;padding-right:6px;opacity:0}
.gv-group-row:hover .gv-group-actions,.gv-group-row:focus-within .gv-group-actions{opacity:1}
.gv-more{flex:0 0 auto;align-self:center;width:22px;height:20px;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:13px;line-height:1}
.gv-more:hover,.gv-more[aria-expanded="true"]{background:var(--gv-hover);color:var(--dsw-alias-label-primary)}
.gv-letter{flex:0 0 12px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;font-weight:600;text-align:center}
.gv-letter-M{color:var(--dsw-alias-state-warn-primary)}
.gv-letter-A{color:var(--dsw-alias-state-success-primary)}
.gv-letter-D{color:var(--dsw-alias-state-error-primary)}
.gv-letter-R{color:var(--dsw-alias-brand-primary)}
.gv-letter-U{color:var(--dsw-alias-state-error-primary)}
.gv-letter-Q{color:var(--dsw-alias-label-secondary)}
.gv-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gv-dir{color:var(--dsw-alias-label-secondary)}
.gv-num{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;font-variant-numeric:tabular-nums}
.gv-add{color:var(--dsw-alias-state-success-primary)}
.gv-del{color:var(--dsw-alias-state-error-primary)}
.gv-flag{font-size:11px;color:var(--dsw-alias-label-secondary)}

.gv-count-hidden{margin-left:2px;padding:0 4px;border-radius:3px;font-size:10px;letter-spacing:0;color:var(--dsw-alias-label-secondary);background:var(--gv-sunken)}
.gv-hunk{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;background:var(--gv-sunken);color:var(--dsw-alias-label-secondary);padding:2px 12px}
.gv-line{display:flex;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:18px;white-space:pre}
.gv-line.add{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent)}
/* The whole file marks additions the same way the comparison does, so the same
   colour means the same thing in both. Unchanged lines stay unstyled: a file
   with one changed line out of two hundred should not read as two hundred. */
.gv-line.ctx .gv-text{color:var(--dsw-alias-label-secondary)}
.gv-line.add .gv-text{color:var(--dsw-alias-label-primary)}
.gv-dropped{display:flex;align-items:center;gap:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:18px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary)}
.gv-dropped-note{flex:1;padding:0 8px;font-family:inherit}
.gv-line.del{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent)}
.gv-no{flex:0 0 48px;text-align:right;padding:0 8px;color:var(--dsw-alias-label-secondary);user-select:none;font-variant-numeric:tabular-nums}
.gv-text{flex:1;min-width:0;padding:0 8px}
.gv-line.wrap .gv-text{white-space:pre-wrap;overflow-wrap:anywhere}
.gv-split{display:flex}
.gv-split .gv-side{flex:1;min-width:0;overflow:auto}
.gv-split .gv-side+.gv-side{border-left:1px solid var(--dsw-alias-border-l1)}
.gv-file{padding:8px 12px}

.gv-menu-row{display:flex;align-items:center;gap:12px;width:100%;padding:4px 10px;font:inherit;font-size:12px;background:transparent;border:0;color:var(--dsw-alias-label-primary);cursor:pointer;text-align:left}
.gv-menu-row:hover:not(:disabled){background:var(--gv-hover)}
.gv-menu-row:disabled{opacity:.55;cursor:default}
.gv-menu-row.danger{color:var(--dsw-alias-state-error-primary)}
.gv-menu-row>span:first-child{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gv-menu-meta{flex:0 0 auto;font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.gv-menu-group{padding:6px 10px 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--dsw-alias-label-secondary)}
.gv-menu-note{padding:8px 10px;font-size:12px;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;word-break:break-word;max-width:280px}
.gv-branch-new{display:flex;gap:6px;padding:6px 10px}
.gv-stash{border-bottom:1px solid var(--dsw-alias-border-l1)}

/* The project layer sits above the commit bar: which repositories are waiting
   on something, so the answer does not require scrolling or clicking. */
.gv-projects{flex:0 0 auto;max-height:40%;overflow:auto;border-bottom:1px solid var(--dsw-alias-border-l1)}
.gv-project{display:flex;align-items:center;gap:7px;width:100%;height:22px;padding:0 10px;border:0;border-radius:0;background:none;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:22px;text-align:left;cursor:pointer}
.gv-project:hover{background:var(--dsw-alias-bg-neutral-hover)}
.gv-project.current{background:var(--dsw-alias-bg-neutral-active)}
.gv-project.current .gv-project-name{font-weight:600}
/* The dot carries the state and the dot alone: four different words beside it
   would compete with a row whose point is to be read in one glance. */
.gv-project-dot{flex:0 0 auto;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-tertiary)}
.gv-project-dot.changed{background:var(--dsw-alias-label-secondary)}
.gv-project-dot.ready{background:var(--dsw-alias-accent-base)}
.gv-project-dot.conflict{background:var(--dsw-alias-state-error-primary)}
/* Not yet read. Hollow rather than filled: a solid dot reads as a known state,
   and this one is the absence of one. */
.gv-project-dot.pending{background:transparent;box-shadow:inset 0 0 0 1px var(--dsw-alias-label-tertiary)}
.gv-project-name{flex:0 1 auto;max-width:52%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gv-project-branch{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-secondary)}
.gv-project-count{flex:0 0 auto;margin-left:auto;font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.gv-project:focus-visible{outline:2px solid var(--dsw-alias-accent-base);outline-offset:-2px}
/* The folded remainder. Deliberately not a project row: it is a count, and it
   must not read as one more repository waiting on something. */
.gv-project-quiet{display:flex;align-items:center;gap:6px;width:100%;height:22px;padding:0 10px;border:0;border-radius:0;background:none;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;line-height:22px;text-align:left;cursor:pointer}
.gv-project-quiet:hover{background:var(--dsw-alias-bg-neutral-hover);color:var(--dsw-alias-label-primary)}
.gv-project-caret{flex:0 0 auto;width:9px;font-size:9px;text-align:center}
`;

// src/view.jsx
var import_jsx_runtime9 = require("react/jsx-runtime");
var INITIALLY_COLLAPSED = /* @__PURE__ */ new Set();
var FILE_SIDE = { staged: "staged", unstaged: "worktree" };
var GROUPS = ["conflicts", "staged", "unstaged"];
var SPLIT_MIN = 0.22;
var SPLIT_MAX = 0.62;
var SPLIT_KEY = "dsh-git-view:split";
var SCOPE_KEY = "dsh-git-view:scope";
var SCOPES = ["whole", "changes", "split"];
var SCOPE_DEFAULT = "whole";
var SPLIT_DEFAULT = 0.44;
function useAvailableHeight() {
  const self = (0, import_react7.useRef)(void 0);
  const [room, setRoom] = (0, import_react7.useState)(600);
  (0, import_react7.useEffect)(() => {
    const el = self.current;
    if (el === void 0) return void 0;
    const clamp = (value) => Math.min(Math.max(Math.round(value), 220), window.innerHeight - 160);
    const seatOf = () => {
      let node = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 40);
      while (node !== null && node !== document.body) {
        if (node.contains(el) === false && node.getBoundingClientRect().height >= 96) return node;
        node = node.parentElement;
      }
      return void 0;
    };
    const composer = seatOf();
    if (composer !== void 0) {
      setRoom(clamp(composer.getBoundingClientRect().top - el.getBoundingClientRect().top - 8));
    } else {
      setRoom(clamp(window.innerHeight - el.getBoundingClientRect().top - 236));
    }
    let viewport = window.innerHeight;
    let seat = composer?.getBoundingClientRect().height ?? 0;
    const onResize = () => {
      setRoom((value) => clamp(value + (window.innerHeight - viewport)));
      viewport = window.innerHeight;
    };
    const observer = composer === void 0 ? void 0 : new ResizeObserver(() => {
      const next = composer.getBoundingClientRect().height;
      setRoom((value) => clamp(value - (next - seat)));
      seat = next;
    });
    if (observer !== void 0) observer.observe(composer);
    window.addEventListener("resize", onResize);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return { self, room };
}
function useSplit() {
  const [ratio, setRatio] = (0, import_react7.useState)(() => {
    try {
      const stored = Number(globalThis.localStorage?.getItem(SPLIT_KEY));
      return stored >= SPLIT_MIN && stored <= SPLIT_MAX ? stored : SPLIT_DEFAULT;
    } catch {
      return SPLIT_DEFAULT;
    }
  });
  const body = (0, import_react7.useRef)(void 0);
  const drag = (0, import_react7.useRef)(void 0);
  const onPointerDown = (0, import_react7.useCallback)(
    (event) => {
      const start = event.currentTarget;
      start.setPointerCapture(event.pointerId);
      const box = body.current?.getBoundingClientRect();
      drag.current = box === void 0 ? void 0 : { left: box.left, width: box.width };
      const move = (e) => {
        const base = drag.current;
        if (base === void 0 || base.width === 0) return;
        const next = (e.clientX - base.left) / base.width;
        setRatio(Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, next)));
      };
      const end = () => {
        drag.current = void 0;
        start.removeEventListener("pointermove", move);
        start.removeEventListener("pointerup", end);
        start.removeEventListener("pointercancel", end);
      };
      start.addEventListener("pointermove", move);
      start.addEventListener("pointerup", end);
      start.addEventListener("pointercancel", end);
    },
    []
  );
  (0, import_react7.useEffect)(() => {
    const save = () => {
      try {
        globalThis.localStorage?.setItem(SPLIT_KEY, String(ratio));
      } catch {
      }
    };
    const timer = setTimeout(save, 400);
    return () => clearTimeout(timer);
  }, [ratio]);
  return { body, style: { flexBasis: `${ratio * 100}%` }, onPointerDown };
}
function useChoice(key, allowed, fallback) {
  const [value, setValue] = (0, import_react7.useState)(() => {
    try {
      const stored = globalThis.localStorage?.getItem(key);
      return allowed.includes(stored) ? stored : fallback;
    } catch {
      return fallback;
    }
  });
  const choose = (0, import_react7.useCallback)((next) => {
    setValue(next);
    try {
      globalThis.localStorage?.setItem(key, next);
    } catch {
    }
  }, [key]);
  return [value, choose];
}
function RepoHeader({ status, onRefresh, sessionId, run, confirm, busy, loading, repoPath }) {
  const repo = status.repo;
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "gv-head", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "gv-repo", title: repo.root, children: repo.name }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(BranchMenu, { sessionId, repo, run, repoPath }),
    repo.ahead > 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "gv-count", children: [
      "\u2191",
      repo.ahead
    ] }) : null,
    repo.behind > 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "gv-count", children: [
      "\u2193",
      repo.behind
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "gv-spacer" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(StashMenu, { sessionId, run, confirm, repoPath }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
      "button",
      {
        type: "button",
        className: "gv-btn",
        onClick: onRefresh,
        disabled: busy || loading,
        "aria-busy": loading,
        title: loading ? t("loading.refreshing") : t("action.refresh"),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: loading ? "gv-spin" : void 0, "aria-hidden": "true", children: "\u27F3" }),
          " ",
          loading ? t("loading.refreshing") : t("action.refresh")
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(RemoteActions, { repo, run, busy }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(RepoBulkMenu, { status, run, confirm, busy })
  ] });
}
function DetailHeader({ file, mode, onMode, split, onSplit, wrap, onWrap, scope: scope2, onScope }) {
  const editable = (file.side === "unstaged" || file.side === "untracked") && (previewKind(file.path) === "source" || previewKind(file.path) === "markdown");
  const viewable = previewKind(file.path) !== "document";
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "gv-detail-head", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "gv-path", title: file.path, children: file.path }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "gv-spacer" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "gv-btn", "aria-pressed": mode === "diff", onClick: () => onMode("diff"), children: t("mode.diff") }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "button",
      {
        type: "button",
        className: "gv-btn",
        "aria-pressed": mode === "file",
        disabled: !viewable,
        title: viewable ? void 0 : t("edit.unavailable"),
        onClick: () => onMode("file"),
        children: t("mode.file")
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "button",
      {
        type: "button",
        className: "gv-btn",
        "aria-pressed": mode === "edit",
        disabled: !editable,
        title: editable ? void 0 : t("edit.unavailable"),
        onClick: () => onMode("edit"),
        children: t("mode.edit")
      }
    ),
    mode === "diff" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "gv-btn", "aria-pressed": scope2 === "whole", onClick: () => onScope("whole"), children: t("diff.whole") }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "gv-btn", "aria-pressed": scope2 === "changes", onClick: () => onScope("changes"), children: t("diff.changes") }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "gv-btn", "aria-pressed": split, onClick: () => onSplit(true), children: t("layout.split") })
    ] }) : null,
    mode === "file" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "gv-btn", "aria-pressed": wrap, onClick: onWrap, children: t("action.wrap") }) : null
  ] });
}
function TreePanel({ status, failure }) {
  if (status === void 0) {
    if (failure !== void 0) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(LoadingAnnounce, { label: treeLoading() }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(TreeSkeleton, {})
    ] });
  }
  if (failure !== void 0) return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "gv-note error", children: failure.message });
  if (status.available === false) {
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "gv-note", children: status.reason === "git-unavailable" ? t("empty.gitUnavailable") : t("empty.notRepository") });
  }
  return null;
}
function GitView({ sessionId, useSessionStatus }) {
  const [status, setStatus] = (0, import_react7.useState)(void 0);
  const [projects, setProjects] = (0, import_react7.useState)(void 0);
  const [summaries, setSummaries] = (0, import_react7.useState)(void 0);
  const [treeDrawn, setTreeDrawn] = (0, import_react7.useState)(false);
  const [projectPath, setProjectPath] = (0, import_react7.useState)(void 0);
  const [failure, setFailure] = (0, import_react7.useState)(void 0);
  const [loading, setLoading] = (0, import_react7.useState)(true);
  const [reload, setReload] = (0, import_react7.useState)(0);
  const [selected, setSelected] = (0, import_react7.useState)(void 0);
  const [diff, setDiff] = (0, import_react7.useState)(void 0);
  const [file, setFile] = (0, import_react7.useState)(void 0);
  const [mode, setMode] = (0, import_react7.useState)("diff");
  const [scope2, setScope] = useChoice(SCOPE_KEY, SCOPES, SCOPE_DEFAULT);
  const split = scope2 === "split";
  const [wrap, setWrap] = (0, import_react7.useState)(false);
  const columns = useSplit();
  const room = useAvailableHeight();
  const [collapsed, setCollapsed] = (0, import_react7.useState)(INITIALLY_COLLAPSED);
  const [pushGate, setPushGate] = (0, import_react7.useState)(void 0);
  const [opened, setOpened] = (0, import_react7.useState)(() => /* @__PURE__ */ new Map());
  const pending = (0, import_react7.useRef)([]);
  (0, import_react7.useEffect)(() => () => pending.current.forEach((controller) => controller.abort()), []);
  const requestOpen = (0, import_react7.useCallback)(
    (dir) => {
      setOpened((current) => {
        if (current.has(dir)) return current;
        const next = new Map(current);
        next.set(dir, { loading: true });
        return next;
      });
      const controller = new AbortController();
      pending.current.push(controller);
      readUntracked(sessionId, `${dir}/`, projectPath, controller.signal).then(
        (answer) => setOpened((current) => {
          const next = new Map(current);
          next.set(dir, { files: answer.files, total: answer.total, truncated: answer.truncated });
          return next;
        })
      ).catch((error) => {
        if (controller.signal.aborted) return;
        setOpened((current) => {
          const next = new Map(current);
          next.set(dir, { failure: error.message });
          return next;
        });
      }).finally(() => {
        pending.current = pending.current.filter((one) => one !== controller);
      });
    },
    [sessionId, projectPath]
  );
  const expand = (0, import_react7.useMemo)(() => ({ state: opened, request: requestOpen }), [opened, requestOpen]);
  const shown = (0, import_react7.useMemo)(() => {
    if (opened.size === 0 || status === void 0) return status;
    return {
      ...status,
      unstaged: status.unstaged.flatMap((file2) => {
        if (file2.dir !== true) return [file2];
        const answer = opened.get(file2.path.replace(/\/+$/, ""));
        return answer?.files ?? [file2];
      })
    };
  }, [status, opened]);
  (0, import_react7.useEffect)(() => {
    const shut = (shown?.unstaged ?? []).filter((file2) => file2.dir === true && file2.status === "?").map((file2) => file2.path.replace(/\/+$/, "")).filter((path) => !opened.has(path));
    if (shut.length === 0) return;
    setCollapsed((current) => {
      const next = new Set(current);
      let changed = false;
      for (const path of shut) {
        if (!next.has(`untracked:${path}`)) {
          next.add(`untracked:${path}`);
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [shown, opened]);
  const hover = useFileHover(sessionId);
  (0, import_react7.useEffect)(() => {
    hover.dismiss();
  }, [status, hover.dismiss]);
  const [checked, setChecked] = (0, import_react7.useState)(() => /* @__PURE__ */ new Set());
  const toggleCheck = (0, import_react7.useCallback)((path) => {
    setChecked((current) => {
      const next = new Set(current);
      if (!next.delete(path)) next.add(path);
      return next;
    });
  }, []);
  (0, import_react7.useEffect)(() => {
    if (status === void 0 || status.available === false) return;
    const live = new Set([...GROUPS].flatMap((group) => (status[group] ?? []).map((file2) => file2.path)));
    setChecked((current) => {
      const next = new Set([...current].filter((path) => live.has(path)));
      return next.size === current.size ? current : next;
    });
  }, [status]);
  const checkedFiles = (0, import_react7.useMemo)(
    () => GROUPS.flatMap((group) => {
      const side = group === "conflicts" ? "unstaged" : group;
      return (status?.[group] ?? []).filter((file2) => checked.has(file2.path)).map((file2) => ({ ...file2, side: sideOf(file2, side) }));
    }),
    [status, checked]
  );
  const running = useSessionStatus?.((snapshot) => snapshot.get(sessionId)?.running);
  const wasRunning = (0, import_react7.useRef)(running);
  (0, import_react7.useEffect)(() => {
    if (wasRunning.current === true && running === false) setReload((value) => value + 1);
    wasRunning.current = running;
  }, [running]);
  (0, import_react7.useEffect)(() => {
    const controller = new AbortController();
    readRepositories(sessionId, reload > 0, controller.signal).then((answer) => {
      setProjects(answer.projects);
      setFailure(void 0);
      setProjectPath(
        (current) => current !== void 0 && answer.projects.some((entry) => entry.path === current) ? current : answer.projects[0]?.path ?? void 0
      );
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setProjects([]);
      setFailure(error);
    });
    return () => controller.abort();
  }, [sessionId, reload]);
  (0, import_react7.useEffect)(() => {
    if (!treeDrawn || projects === void 0 || projects.length === 0) return void 0;
    const controller = new AbortController();
    readSummaries(sessionId, controller.signal).then((answer) => setSummaries(answer.summaries)).catch((error) => {
      if (!controller.signal.aborted) setSummaries([]);
    });
    return () => controller.abort();
  }, [sessionId, reload, projects, treeDrawn]);
  (0, import_react7.useEffect)(() => {
    const controller = new AbortController();
    setFailure(void 0);
    setLoading(true);
    readStatus(sessionId, projectPath, controller.signal).then((answer) => {
      setStatus(answer);
      setTreeDrawn(true);
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setStatus(void 0);
      setFailure(error);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [sessionId, projectPath, reload]);
  (0, import_react7.useEffect)(() => {
    if (selected === void 0 || status === void 0 || status.available === false) return;
    const stillThere = (status[selected.side] ?? []).some((file2) => file2.path === selected.path);
    if (stillThere) return;
    const side = GROUPS.find((group) => (status[group] ?? []).some((file2) => file2.path === selected.path));
    if (side === void 0) setSelected(void 0);
    else setSelected((current) => current === void 0 ? current : { ...current, side });
  }, [status, selected]);
  (0, import_react7.useEffect)(() => {
    if (selected === void 0) {
      setDiff(void 0);
      return void 0;
    }
    const controller = new AbortController();
    setDiff(void 0);
    readDiff(sessionId, selected.path, selected.side, projectPath, controller.signal).then((answer) => setDiff(answer)).catch((error) => {
      if (controller.signal.aborted) return;
      setDiff({ kind: "error", message: error.message });
    });
    return () => controller.abort();
  }, [sessionId, selected, projectPath]);
  const fileKey = (0, import_react7.useRef)(void 0);
  const needsText = selected !== void 0 && (mode === "file" || mode === "edit" || mode === "diff" && scope2 === "whole");
  (0, import_react7.useEffect)(() => {
    if (selected === void 0) {
      fileKey.current = void 0;
      setFile(void 0);
      return void 0;
    }
    if (!needsText) return void 0;
    const key = `${projectPath ?? ""}:${selected.side}:${selected.path}#${reload}`;
    if (fileKey.current === key) return void 0;
    const controller = new AbortController();
    fileKey.current = key;
    setFile(void 0);
    readFile(sessionId, selected.path, FILE_SIDE[selected.side] ?? "worktree", projectPath, controller.signal).then((answer) => setFile(answer)).catch((error) => {
      if (controller.signal.aborted) return;
      setFile({ kind: "error", message: error.message });
    });
    return () => controller.abort();
  }, [sessionId, selected, needsText, reload, projectPath]);
  const [generateGate, setGenerateGate] = (0, import_react7.useState)(void 0);
  const confirmGenerate = (0, import_react7.useCallback)(async (make) => {
    setGenerateGate({
      title: t("commit.replaceTitle"),
      description: t("commit.replaceBody"),
      resolve: (value) => {
        setGenerateGate(void 0);
        return value ? make() : void 0;
      }
    });
    return void 0;
  }, []);
  const toggleGroup = (0, import_react7.useCallback)((key) => {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }, []);
  const toggleDir = (0, import_react7.useCallback)((key) => {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }, []);
  const reloadStatus = (0, import_react7.useCallback)(
    () => readStatus(sessionId, projectPath).then((answer) => {
      setStatus(answer);
      setFailure(void 0);
    }).catch((error) => setFailure(error)),
    [sessionId, projectPath]
  );
  const refreshAll = (0, import_react7.useCallback)(() => {
    setReload((value) => value + 1);
  }, []);
  const actions = useActions(sessionId, reloadStatus, projectPath);
  const { run, confirm, gate, dismiss, busy, generating, generateMessage, problem, working, done } = actions;
  const move = (0, import_react7.useCallback)(
    (step) => {
      if (status?.available !== true) return;
      const order = visibleOrder(shown, collapsed);
      if (order.length === 0) return;
      const at = order.findIndex((entry) => entry.path === selected?.path);
      const next = at < 0 ? step > 0 ? 0 : order.length - 1 : Math.min(order.length - 1, Math.max(0, at + step));
      const target = order[next];
      const file2 = [...status.conflicts, ...status.staged, ...status.unstaged].find(
        (candidate) => candidate.path === target.path
      );
      if (file2 !== void 0) setSelected({ ...file2, side: target.side });
    },
    [status, collapsed, selected]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "gv", ref: room.self, style: { "--gv-room": `${room.room}px` }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("style", { children: CSS }),
    status?.available === true && failure === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      RepoHeader,
      {
        status,
        onRefresh: refreshAll,
        sessionId,
        run,
        confirm,
        busy,
        loading,
        repoPath: projectPath
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "gv-head", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "gv-spacer" }) }),
    problem === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "gv-banner error", children: problem }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "gv-body", ref: columns.body, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "gv-list", style: columns.style, children: status === void 0 || status.available === false ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(TreePanel, { status, failure }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          CommitBar,
          {
            staged: status.staged,
            busy,
            generating,
            problem,
            working,
            done,
            run,
            generateMessage,
            confirmGenerate,
            confirmPush: () => setPushGate({ repo: status.repo }),
            repo: status.repo,
            projectName: status.repo?.name,
            projects,
            summaries,
            currentProject: projectPath,
            onSelectProject: setProjectPath
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "div",
          {
            className: "gv-tree-scroll",
            tabIndex: 0,
            role: "tree",
            "aria-label": t("view.git"),
            onKeyDown: (event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                move(1);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                move(-1);
              }
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
              FileTree,
              {
                status: shown,
                selected,
                onSelect: setSelected,
                collapsed,
                onToggle: toggleGroup,
                onToggleDir: toggleDir,
                actions: { run, confirm },
                hover,
                checked,
                onCheck: toggleCheck,
                expand
              }
            )
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(SelectionBar, { files: checkedFiles, run, confirm })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        "div",
        {
          className: "gv-sizer",
          role: "separator",
          "aria-orientation": "vertical",
          "aria-label": t("view.resize"),
          onPointerDown: columns.onPointerDown
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "gv-detail", children: selected === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "gv-note", children: t("empty.select") }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          DetailHeader,
          {
            file: selected,
            mode,
            onMode: setMode,
            split,
            onSplit: () => setScope("split"),
            wrap,
            onWrap: () => setWrap((value) => !value),
            scope: scope2,
            onScope: setScope
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "gv-scroll", children: mode === "diff" ? scope2 === "whole" ? (
          // The whole file is shown from the same text the editor edits, and the
          // change is marked from the diff's own line numbers.
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            WholeFileView,
            {
              data: file,
              marks: markChanges(diff?.hunks),
              wrap
            }
          )
        ) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(DiffView, { data: diff, split, wrap }) : mode === "edit" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          FileEditor,
          {
            data: file,
            path: selected.path,
            sessionId,
            repoPath: projectPath,
            onSaved: () => setReload((value) => value + 1)
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(FileView, { data: file, wrap, path: selected.path }) })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(RiskGate, { gate, onDismiss: dismiss, run }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      PushGate,
      {
        gate: pushGate,
        onClose: () => setPushGate(void 0),
        onConfirm: () => {
          const target = pushGate?.repo?.upstream ?? "origin";
          setPushGate(void 0);
          run(
            { action: "push" },
            {
              working: t("push.working", { target }),
              done: t("push.done", { target })
            }
          );
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      import_dsh_client_ui_primitives4.RiskConfirmation,
      {
        open: generateGate !== void 0,
        title: generateGate?.title,
        description: generateGate?.description,
        acknowledgeLabel: t("common.cancel"),
        confirmLabel: t("commit.generate"),
        onCancel: () => generateGate?.resolve(false),
        onConfirm: () => generateGate?.resolve(true)
      }
    ),
    hover.card
  ] });
}

// src/entry.jsx
var inject = ["slots", "uiSession", "locale"];
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "git-view: dictionaries");
  bindLocale(ctx);
  ctx.slots.inject(
    "conversation.view",
    () => ctx.slots.register(
      {
        name: "conversation.view",
        id: "git",
        order: 20,
        locale: NS,
        label: () => t("view.git")
      },
      GitView
    )
  );
}

    return module.exports;
  },
});
