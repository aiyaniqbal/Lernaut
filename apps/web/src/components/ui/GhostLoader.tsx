import React from 'react';
import './GhostLoader.css';

export const GhostLoader: React.FC = () => {
  return (
    <div className="ghost-container">
      <div className="ghost">
        <div className="ghost-red">
          {/* Static Blocks */}
          <div className="top0"></div>
          <div className="top1"></div>
          <div className="top2"></div>
          <div className="top3"></div>
          <div className="top4"></div>
          <div className="st0"></div>
          <div className="st1"></div>
          <div className="st2"></div>
          <div className="st3"></div>
          <div className="st4"></div>
          <div className="st5"></div>

          {/* Animated/Flicker Blocks */}
          <div className="an1"></div>
          <div className="an2"></div>
          <div className="an3"></div>
          <div className="an4"></div>
          <div className="an6"></div>
          <div className="an7"></div>
          <div className="an8"></div>
          <div className="an9"></div>
          <div className="an10"></div>
          <div className="an11"></div>
          <div className="an12"></div>
          <div className="an13"></div>
          <div className="an15"></div>
          <div className="an16"></div>
          <div className="an17"></div>
          <div className="an18"></div>
        </div>

        {/* Eyes */}
        <div className="ghost-eye"></div>
        <div className="ghost-eye1"></div>

        {/* Pupils */}
        <div className="ghost-pupil"></div>
        <div className="ghost-pupil1"></div>

        {/* Shadow */}
        <div className="ghost-shadow"></div>
      </div>
    </div>
  );
};
