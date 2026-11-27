#!/usr/bin/env python3
"""Build 763 isolated concurrency rehearsal using original 0046 triggers.
No production data or payment mutation. Executes prior fixture as setup.
"""
import contextlib
import io
import runpy
import sqlite3
import tempfile
import threading
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
with contextlib.redirect_stdout(io.StringIO()):
    fixture = runpy.run_path(str(ROOT / 'scripts/release467_build450_finished_pieces_sql_regression.py'))
source = fixture['db']
source.commit()
# Make one new canonical, approved piece and independent pending orders.
source.execute("INSERT INTO products VALUES(301,'active','approved','physical',1,1)")
attempt = fixture['create_attempt']('build763-race')
fixture['review'](attempt,'approved_for_sale')
fixture['link'](attempt,301)
piece = fixture['piece']('RACE-763-001',attempt,301)
source.execute("INSERT INTO orders VALUES(7631,'pending','pending')")
source.execute("INSERT INTO orders VALUES(7632,'pending','pending')")
source.commit()
for mode in ('simultaneous','local_first','guest_first'):
    with tempfile.TemporaryDirectory() as tmp:
        path = str(Path(tmp)/'race.sqlite')
        with sqlite3.connect(path) as dest:
            source.backup(dest)
        barrier = threading.Barrier(2)
        first_done = threading.Event()
        outcomes = {}
        def worker(channel):
            db = sqlite3.connect(path,timeout=10)
            db.execute('PRAGMA foreign_keys=ON')
            try:
                barrier.wait(timeout=10)
                if (mode=='local_first' and channel=='guest') or (mode=='guest_first' and channel=='local'):
                    assert first_done.wait(timeout=10)
                try:
                    if channel=='local':
                        db.execute("INSERT INTO maker_finished_piece_claims(maker_finished_piece_id,action,channel,claim_note,recorded_by_user_id,request_key,payload_sha256) VALUES(?,'reserved','local','Counter reservation of physical piece',1,'build763-local',?)",(piece,'b'*64))
                    else:
                        db.execute('INSERT INTO order_items VALUES(7631,7631,301,1)')
                    db.commit()
                    outcomes[channel]='won'
                except sqlite3.IntegrityError:
                    # RAISE(FAIL) cancellation must be preserved on guest conflict.
                    db.commit()
                    outcomes[channel]='denied'
            finally:
                first_done.set()
                db.close()
        threads=[threading.Thread(target=worker,args=(c,)) for c in ('local','guest')]
        for t in threads:t.start()
        for t in threads:t.join(15)
        assert all(not t.is_alive() for t in threads)
        assert sorted(outcomes.values())==['denied','won'], (mode,outcomes)
        if mode!='simultaneous': assert outcomes[mode.split('_')[0]]=='won'
        with sqlite3.connect(path) as db:
            assert db.execute('SELECT available_quantity FROM maker_finished_piece_sellability WHERE product_id=301').fetchone()[0]==0
            assert db.execute('SELECT inventory_quantity FROM products WHERE product_id=301').fetchone()[0]==1
            if outcomes['guest']=='denied':
                assert db.execute('SELECT order_status FROM orders WHERE order_id=7631').fetchone()[0]=='cancelled'
                assert db.execute('SELECT COUNT(*) FROM order_items WHERE order_id=7631').fetchone()[0]==0
            else:
                assert db.execute('SELECT COUNT(*) FROM order_items WHERE order_id=7631').fetchone()[0]==1
            assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
        print('BUILD763 isolated race:',mode,outcomes)
print('BUILD763 database rehearsal passed; not browser, D1 production, or settlement certification.')
