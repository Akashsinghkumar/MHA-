import React, { useState } from 'react';
import { inr, mediaUrl, useStore } from '../context/StoreContext.jsx';
import ProductCard from '../components/ProductCard.jsx';

const ROOMS = ['Living Room', 'Bedroom', 'Dining', 'Home Office', 'Other Furniture'];

export default function FurniturePage() {
  const { products, siteContent, addToCart, toast } = useStore();
  const page = siteContent.furniture || {};
  const [plannerRoom, setPlannerRoom] = useState('Living Room');
  const [roomPlans, setRoomPlans] = useState({});
  const [roomFilter, setRoomFilter] = useState('');

  const furnitureProducts = products.filter((p) => p.category === 'Furniture');
  const roomMatches = furnitureProducts.filter((p) => p.subcategory === plannerRoom);
  const plan = roomPlans[plannerRoom] || [];

  const gridProducts = roomFilter
    ? furnitureProducts.filter((p) => p.subcategory === roomFilter)
    : furnitureProducts;

  function addItemToRoom(id, x = 50, y = 50) {
    setRoomPlans((prev) => ({
      ...prev,
      [plannerRoom]: [
        ...(prev[plannerRoom] || []),
        { key: `room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, id: Number(id), x, y },
      ],
    }));
  }

  function moveItem(key, x, y) {
    setRoomPlans((prev) => ({
      ...prev,
      [plannerRoom]: (prev[plannerRoom] || []).map((it) =>
        it.key === key ? { ...it, x: Math.max(5, Math.min(95, x)), y: Math.max(8, Math.min(92, y)) } : it
      ),
    }));
  }

  function removeItem(key) {
    setRoomPlans((prev) => ({
      ...prev,
      [plannerRoom]: (prev[plannerRoom] || []).filter((it) => it.key !== key),
    }));
  }

  function handleDrop(e) {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const [mode, val] = raw.split('|');
    if (mode === 'new') addItemToRoom(val, x, y);
    else if (mode === 'move') moveItem(val, x, y);
  }

  const planTotal = plan.reduce((sum, item) => {
    const p = products.find((x) => x.id === item.id);
    return sum + (p ? p.offerPrice : 0);
  }, 0);

  return (
    <main id="store" className="category-mode">
      <div className="home-directory" style={{ display: 'block' }}>
        <section className="page-banner" id="furnitureIntro">
          <div>
            <span>{page.badge || 'FIND YOUR COMFORT'}</span>
            <h1>{page.title || 'Furniture for every room'}</h1>
            <p>{page.subtitle || 'Explore thoughtful pieces for living, sleeping, dining and working spaces.'}</p>
          </div>
          <img src={mediaUrl(page.imageUrl, 'Furniture.webp')} alt={page.title || 'Furniture for every room'} />
        </section>

        <section className="room-planner" id="roomPlanner">
          <div className="room-planner-heading">
            <div>
              <small>PLAN YOUR SPACE</small>
              <h2>Shop by room</h2>
              <p>Choose a room and drag furniture into your own layout.</p>
            </div>
            <span className="planner-selected-count">{plan.length} item{plan.length === 1 ? '' : 's'} selected</span>
          </div>

          <div className="room-type-tabs" role="tablist">
            {ROOMS.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                className={r === plannerRoom ? 'on' : ''}
                onClick={() => setPlannerRoom(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="room-planner-layout">
            <div className="room-planner-catalog">
              <h3>{plannerRoom} furniture</h3>
              <p className="planner-catalog-tip">Drag a product onto the room canvas, or tap Add to room.</p>
              <div className="planner-product-grid">
                {roomMatches.length ? roomMatches.map((p) => (
                  <article
                    key={p.id}
                    className="planner-product"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', `new|${p.id}`)}
                  >
                    <img src={p.imageUrl} alt={p.name} loading="lazy" />
                    <div className="planner-product-info">
                      <b>{p.name}</b>
                      <span>{inr(p.offerPrice)}</span>
                      <button type="button" onClick={() => addItemToRoom(p.id)}>Add to room +</button>
                    </div>
                  </article>
                )) : <p>No products are listed for this room yet.</p>}
              </div>
            </div>

            <aside className="room-planner-preview">
              <div className="planner-preview-head">
                <div><small>YOUR ROOM CANVAS</small><h3>{plannerRoom}</h3></div>
                <div className="planner-total">
                  <strong>{inr(planTotal)}</strong>
                  <button
                    type="button"
                    className="planner-clear"
                    disabled={!plan.length}
                    onClick={() => setRoomPlans((prev) => ({ ...prev, [plannerRoom]: [] }))}
                  >
                    Clear room
                  </button>
                </div>
              </div>

              <div
                className="room-stage room-empty-canvas"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <div className="room-stage-slots">
                  {plan.length ? plan.map((item) => {
                    const p = products.find((x) => x.id === item.id);
                    if (!p) return null;
                    return (
                      <article
                        key={item.key}
                        className="room-stage-slot room-placed-item"
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', `move|${item.key}`)}
                        style={{ left: `${item.x}%`, top: `${item.y}%` }}
                      >
                        <img src={p.imageUrl} alt={p.name} draggable={false} />
                        <b>{p.name}</b>
                        <span>{inr(p.offerPrice)}</span>
                        <button type="button" onClick={() => removeItem(item.key)}>×</button>
                      </article>
                    );
                  }) : <div className="room-stage-empty">Drop furniture here to start arranging your room.</div>}
                </div>
              </div>

              <p className="room-planner-tip">
                {plan.length
                  ? 'Drag placed pieces to rearrange them. Remove an item or clear the room to start over.'
                  : 'Your canvas is empty. Drag a product from the catalog into the room.'}
              </p>
              <button
                className="btn planner-add-all"
                type="button"
                disabled={!plan.length}
                onClick={() => {
                  plan.forEach((it) => addToCart(it.id, 1));
                  toast('Room items added to your cart');
                }}
              >
                Add selected items to cart
              </button>
            </aside>
          </div>
        </section>
      </div>

      <section className="room-browser">
        <h3>Furniture · Shop by Room</h3>
        <div className="room-chips">
          <button type="button" className={!roomFilter ? 'on' : ''} onClick={() => setRoomFilter('')}>All Furniture</button>
          {ROOMS.map((r) => (
            <button key={r} type="button" className={roomFilter === r ? 'on' : ''} onClick={() => setRoomFilter(r)}>{r}</button>
          ))}
        </div>
      </section>

      <div className="bar"><h2>Furniture ({gridProducts.length})</h2></div>
      <div className="grid" id="gr">
        {gridProducts.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </main>
  );
}
