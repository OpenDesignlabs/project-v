import {
    Star, Heart, User, Mail, Phone, MapPin, CheckCircle, AlertTriangle,
    Info, Settings, Bell, Globe, Home, Calculator, Lock, Zap,
    MessageSquare, ArrowRight, Menu, MoreHorizontal, Activity,
    UserCircle, Shield, Layout, Megaphone, Briefcase, Laptop,
    LayoutDashboard, Camera, Clock, Calendar, Search, Send,
    ThumbsUp, Share2, Bookmark, Download, Upload, Edit, Trash2,
    Plus, Minus, X, Check, ChevronRight, ChevronLeft, ChevronUp, ChevronDown
} from 'lucide-react';

/**
 * Icon Registry - Maps string names to Lucide React components
 * Used for rendering icons stored as strings in the project JSON
 */
export const ICON_REGISTRY: Record<string, any> = {
    // Common
    Star,
    Heart,
    User,
    Mail,
    Phone,
    MapPin,
    CheckCircle,
    AlertTriangle,
    Info,
    Settings,
    Bell,
    Globe,
    Home,
    Calculator,
    Lock,
    Zap,
    MessageSquare,
    ArrowRight,
    Menu,
    MoreHorizontal,
    Activity,
    UserCircle,
    Shield,
    Layout,
    Megaphone,
    Briefcase,
    Laptop,
    LayoutDashboard,
    Camera,
    Clock,
    Calendar,
    Search,
    Send,
    ThumbsUp,
    Share2,
    Bookmark,
    Download,
    Upload,
    Edit,
    Trash2,
    Plus,
    Minus,
    X,
    Check,
    ChevronRight,
    ChevronLeft,
    ChevronUp,
    ChevronDown,
};

/**
 * Get an icon component by name, with fallback
 */
export const getIconByName = (name: string, fallback: any = Star) => {
    return ICON_REGISTRY[name] || fallback;
};

/**
 * Get all available icon names
 */
export const getAvailableIconNames = (): string[] => {
    return Object.keys(ICON_REGISTRY);
};
