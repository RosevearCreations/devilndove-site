#!/usr/bin/env python3
from pathlib import Path
import json,subprocess
root=Path(__file__).resolve().parents[1]
p=json.loads((root/'current-development-authority.json').read_text())
a=json.loads((root/'release467-build378-cross-project-workstations-equipment-capacity-planner.json').read_text())
assert p['build']>=378
if p['build']==378: assert p['title']==a['title']
assert p['restart_integrity']['last_fully_verified']['build']>=377
if p['build']==378: assert a['starting_point']['development']['sha']==p['accepted_dev_sha']
if p['build']==378: assert a['starting_point']['development']['tree']==p['accepted_dev_tree_sha']
assert 'getAdminUserFromRequest' in (root/'functions/api/admin/project-capacity-planner.js').read_text()
assert 'inventory_workstation_memberships' in (root/'functions/api/admin/project-capacity-planner.js').read_text()
assert 'AVAILABILITY_UNVERIFIED' in (root/'functions/api/admin/_lib/crossProjectCapacity.js').read_text()
assert 'Work Orders, Task Sequencing & Time Capture' in (root/'docs/operations/RELEASE_467_BUILD_378_CROSS_PROJECT_CAPACITY.md').read_text()
subprocess.run(['node','--test','scripts/release467_build378_capacity.test.mjs'],cwd=root,check=True)
print('RELEASE467_BUILD378_GATE=GREEN')
