import React from 'react';
import {
  Star, Heart, Bookmark, Flag, Tag, Hash, Home, User, Users, Settings, Bell, Mail,
  Calendar, Clock, MapPin, Phone, Camera, Image, Folder, File, Archive, Trash2,
  Download, Upload, Search, Filter, Menu, MoreVertical, ChevronDown, ChevronUp,
  Plus, Minus, X, Check, AlertCircle, Info, Edit, Copy, Share, Link, ExternalLink,
  Lock, Code, Terminal, Database, Server, Cloud, Wifi, ShoppingCart, CreditCard,
  Package, Truck, Store, Music, Play, Pause, Volume2, Headphones, Mic, Book,
  BookOpen, FileText, PenTool, Highlighter, Type, Layout, LayoutGrid, Grid, List,
  Columns, Sidebar, Layers, Circle, Square, Triangle, Hexagon, Zap, Target, Rocket,
  Plane, Car, Bike, Ship, Train, Moon, Sun, CloudRain, CloudSnow, Wind, Thermometer,
  Github, Gitlab, Chrome, MessageSquare, MessageCircle, Send, AtSign, Percent, Globe,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

// 显式映射表：只打包用到的图标，避免 `import *` 把整套 lucide 打进首屏
const ICONS: Record<string, LucideIcon> = {
  Star, Heart, Bookmark, Flag, Tag, Hash, Home, User, Users, Settings, Bell, Mail,
  Calendar, Clock, MapPin, Phone, Camera, Image, Folder, File, Archive, Trash2,
  Download, Upload, Search, Filter, Menu, MoreVertical, ChevronDown, ChevronUp,
  Plus, Minus, X, Check, AlertCircle, Info, Edit, Copy, Share, Link, ExternalLink,
  Lock, Code, Terminal, Database, Server, Cloud, Wifi, ShoppingCart, CreditCard,
  Package, Truck, Store, Music, Play, Pause, Volume2, Headphones, Mic, Book,
  BookOpen, FileText, PenTool, Highlighter, Type, Layout, LayoutGrid, Grid, List,
  Columns, Sidebar, Layers, Circle, Square, Triangle, Hexagon, Zap, Target, Rocket,
  Plane, Car, Bike, Ship, Train, Moon, Sun, CloudRain, CloudSnow, Wind, Thermometer,
  Github, Gitlab, Chrome, MessageSquare, MessageCircle, Send, AtSign, Percent, Globe,
  Video,
};

const Icon: React.FC<IconProps> = ({ name, size = 20, className }) => {
  const IconComponent = ICONS[name] || Link;
  return <IconComponent size={size} className={className} />;
};

export default Icon;
